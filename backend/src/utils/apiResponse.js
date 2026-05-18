export class ApiResponse {
  static success(res, data, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data, message = 'Tạo mới thành công') {
    return this.success(res, data, message, 201);
  }

  static paginated(res, data, pagination, message = 'Thành công') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        totalItems: pagination.total,
        itemsPerPage: pagination.limit,
        hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    });
  }

  static error(res, message, statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }

  static unauthorized(res, message = 'Không có quyền truy cập') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Bị cấm truy cập') {
    return this.error(res, message, 403);
  }

  static notFound(res, message = 'Không tìm thấy') {
    return this.error(res, message, 404);
  }

  static badRequest(res, message = 'Yêu cầu không hợp lệ', errors = null) {
    return this.error(res, message, 400, errors);
  }
}

// Helper functions for backward compatibility
export const apiSuccess = (data, message) => ({ success: true, message, data });
export const apiError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export default ApiResponse;
