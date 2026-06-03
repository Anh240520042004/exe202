import express from 'express';
import { protect, optionalAuth } from '../middleware/auth.js';
import { admin } from '../middleware/auth.js';
import Post from '../models/Post.js';
import PostLike from '../models/PostLike.js';
import Comment from '../models/Comment.js';
import Tag from '../models/Tag.js';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// ─── GET /api/posts — Feed ────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      sort = 'newest',       // newest | hot | comments
      tag,
      author,
      search,
    } = req.query;

    const filter = { isDeleted: false, isHidden: false };
    if (tag) filter.tags = tag.toLowerCase();
    if (author) filter.author = author;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOpt = { isPinned: -1, createdAt: -1 };
    if (sort === 'hot') sortOpt = { isPinned: -1, likeCount: -1, commentCount: -1, createdAt: -1 };
    if (sort === 'comments') sortOpt = { isPinned: -1, commentCount: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOpt)
        .skip(skip).limit(Number(limit))
        .populate('author', 'name avatar role')
        .lean(),
      Post.countDocuments(filter),
    ]);

    return res.json(apiSuccess({
      posts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/posts/:id ──────────────────────────────────────────────────
router.get('/tags/trending', async (req, res, next) => {
  try {
    const tags = await Tag.find()
      .sort({ count: -1 })
      .limit(20)
      .lean();
    return res.json(apiSuccess(tags));
  } catch (error) {
    next(error);
  }
});

router.get('/users/:userId/posts', async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.params.userId, isDeleted: false, isHidden: false })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar role')
      .lean();
    return res.json(apiSuccess(posts));
  } catch (error) {
    next(error);
  }
});

router.get('/admin/all', protect, admin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isDeleted: false };
    if (req.query.hidden === 'true') filter.isHidden = true;
    if (req.query.hidden === 'false') filter.isHidden = false;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit))
        .populate('author', 'name avatar role')
        .lean(),
      Post.countDocuments(filter),
    ]);

    return res.json(apiSuccess({
      posts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('author', 'name avatar role studentProfile').lean();

    if (!post) return next(apiError('Post not found', 404));
    // Hidden posts only visible to author or admin
    if (post.isDeleted) return next(apiError('Post not found', 404));
    if (post.isHidden) {
      const canViewHidden =
        req.user?.role === 'admin' ||
        req.user?._id?.toString() === post.author?._id?.toString();

      if (!canViewHidden) return next(apiError('Post not found', 404));
    }

    const comments = await Comment.find({ post: post._id, parent: null })
      .sort({ createdAt: 1 })
      .populate('author', 'name avatar')
      .populate({
        path: 'parent',
        populate: { path: 'author', select: 'name avatar' },
      })
      .lean();

    return res.json(apiSuccess({ post, comments }));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/posts ─────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    // Only student and mentor can post
    if (!['student', 'mentor'].includes(req.user.role)) {
      return next(apiError('Chỉ student và mentor mới có thể đăng bài', 403));
    }

    const { title, content, tags = [], images = [] } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return next(apiError('Title and content are required', 400));
    }

    const normalizedTags = tags.map(t => t.toLowerCase().trim()).filter(Boolean);

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      author: req.user.id,
      tags: normalizedTags,
      images,
    });

    if (normalizedTags.length > 0) {
      await Promise.all(normalizedTags.map(name =>
        Tag.findOneAndUpdate(
          { name },
          { $inc: { count: 1 }, $setOnInsert: { name } },
          { upsert: true, new: true }
        )
      ));
    }

    const populated = await Post.findById(post._id).populate('author', 'name avatar role').lean();
    return res.status(201).json(apiSuccess(populated, 'Post created'));
  } catch (error) {
    next(error);
  }
});

// ─── PUT /api/posts/:id ──────────────────────────────────────────────────
router.put('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return next(apiError('Post not found', 404));
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }

    const { title, content, tags, images } = req.body;
    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (tags) post.tags = tags.map(t => t.toLowerCase().trim());
    if (images) post.images = images;

    await post.save();
    return res.json(apiSuccess(post, 'Post updated'));
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/posts/:id — user/mentor deletes own post ────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return next(apiError('Post not found', 404));
    // Own post or admin
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }

    post.isDeleted = true;
    await post.save();
    return res.json(apiSuccess(null, 'Post deleted'));
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/posts/:id/hide — admin hides/unhides ───────────────────
router.patch('/:id/hide', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(apiError('Only admin can hide posts', 403));
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return next(apiError('Post not found', 404));

    const { hidden, reason } = req.body;
    post.isHidden = hidden !== false;
    post.hiddenBy = hidden !== false ? req.user.id : null;
    post.hiddenReason = hidden !== false ? (reason || null) : null;
    await post.save();

    return res.json(apiSuccess(
      { isHidden: post.isHidden },
      hidden !== false ? 'Bài viết đã bị ẩn' : 'Bài viết đã được hiển thị lại'
    ));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/posts/:id/like ───────────────────────────────────────────
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return next(apiError('Post not found', 404));
    if (post.isHidden && req.user.role !== 'admin') return next(apiError('Post not found', 404));

    const existing = await PostLike.findOne({ post: post._id, user: req.user.id });
    let liked;

    if (existing) {
      await PostLike.deleteOne({ _id: existing._id });
      post.likeCount = Math.max(0, post.likeCount - 1);
      liked = false;
    } else {
      await PostLike.create({ post: post._id, user: req.user.id });
      post.likeCount += 1;
      liked = true;
    }
    await post.save();

    return res.json(apiSuccess({ liked, likeCount: post.likeCount }));
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/posts/:id/comments ──────────────────────────────────────
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    if (!content?.trim()) return next(apiError('Comment content required', 400));

    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) return next(apiError('Post not found', 404));
    if (post.isHidden && req.user.role !== 'admin') return next(apiError('Post not found', 404));

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      content: content.trim(),
      parent: parentId || null,
    });

    post.commentCount += 1;
    await post.save();

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
    }

    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        user: post.author,
        title: 'Bình luận mới',
        message: `${req.user.name} đã bình luận bài viết của bạn`,
        type: 'forum',
      });
    }

    const populated = await Comment.findById(comment._id)
      .populate('author', 'name avatar')
      .lean();

    return res.status(201).json(apiSuccess(populated, 'Comment added'));
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/posts/:id/comments/:commentId ──────────────────────────
router.delete('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return next(apiError('Comment not found', 404));
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(apiError('Not authorized', 403));
    }

    await Comment.deleteOne({ _id: comment._id });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentCount: -1 } });
    return res.json(apiSuccess(null, 'Comment deleted'));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/posts/tags/trending ───────────────────────────────────────
router.get('/tags/trending', async (req, res, next) => {
  try {
    const tags = await Tag.find()
      .sort({ count: -1 })
      .limit(20)
      .lean();
    return res.json(apiSuccess(tags));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/posts/users/:userId/posts ──────────────────────────────
router.get('/users/:userId/posts', async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.params.userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar role')
      .lean();
    return res.json(apiSuccess(posts));
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/posts/admin/all — admin sees all including hidden ───────────
router.get('/admin/all', protect, admin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isDeleted: false };
    if (req.query.hidden === 'true') filter.isHidden = true;
    if (req.query.hidden === 'false') filter.isHidden = false;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit))
        .populate('author', 'name avatar role')
        .lean(),
      Post.countDocuments(filter),
    ]);

    return res.json(apiSuccess({
      posts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (error) {
    next(error);
  }
});

export default router;
