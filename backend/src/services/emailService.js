import nodemailer from 'nodemailer';
import crypto from 'crypto';
import config from '../config/index.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('Email service initialized with SMTP');
    } else {
      console.log('Email service running in MOCK mode - emails will be logged to console');
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"FPTAIEZ" <${process.env.SMTP_USER}>`,
          to,
          subject,
          html,
          text: text || this.htmlToText(html),
        });
        console.log('=== EMAIL SENT ===');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Message ID:', info.messageId);
        console.log('==================');
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
      }
    }

    console.log('=== EMAIL MOCK ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('==================');
    return { success: true, message: 'Email đã được gửi (mock)' };
  }

  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  }

  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Chào mừng đến với FPTAIEZ',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Chào mừng ${user.name}!</h1>
            </div>
            <div class="content">
              <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>FPTAIEZ</strong>.</p>
              <p>FPTAIEZ là nền tảng học tập thông minh giúp bạn:</p>
              <ul>
                <li>Truy cập tài liệu học tập chất lượng cao</li>
                <li>Kết nối với các mentor giàu kinh nghiệm</li>
                <li>Sử dụng AI Assistant để hỗ trợ học tập</li>
                <li>Theo dõi và quản lý tiến độ học tập</li>
              </ul>
              <a href="${config.clientUrl}/dashboard" class="button">Bắt đầu ngay</a>
            </div>
            <div class="footer">
              <p>FPTAIEZ - Học tập thông minh, thành công bền vững</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.clientUrl}/reset-password/${resetToken}`;
    return this.sendEmail({
      to: user.email,
      subject: 'Đặt lại mật khẩu - FPTAIEZ',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Yêu cầu đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name}</strong>,</p>
              <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </div>
              <div class="warning">
                <strong>Lưu ý:</strong>
                <ul>
                  <li>Link có hiệu lực trong <strong>10 phút</strong></li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                  <li>Không chia sẻ link này cho bất kỳ ai</li>
                </ul>
              </div>
              <p>Hoặc sao chép link sau vào trình duyệt:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>FPTAIEZ - Học tập thông minh</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendEmailVerification(user, verificationCode) {
    return this.sendEmail({
      to: user.email,
      subject: 'Xác thực email - FPTAIEZ',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
            .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Xác thực địa chỉ Email</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký FPTAIEZ. Vui lòng nhập mã xác thực bên dưới để hoàn tất đăng ký:</p>
              <div class="code-box">
                <div class="code">${verificationCode}</div>
              </div>
              <div class="warning">
                <strong>Lưu ý:</strong>
                <ul>
                  <li>Mã xác thực có hiệu lực trong <strong>5 phút</strong></li>
                  <li>Không chia sẻ mã này cho bất kỳ ai</li>
                </ul>
              </div>
              <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>FPTAIEZ - Học tập thông minh</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendPaymentConfirmation(user, paymentDetails) {
    const { orderId, amount, method, documents = [], transactionCode, paymentDate } = paymentDetails;
    
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
    const formattedDate = new Date(paymentDate).toLocaleString('vi-VN');
    
    const documentsList = documents.length > 0 
      ? documents.map(doc => `<li>${doc.title || doc}</li>`).join('')
      : '<li>Thanh toán dịch vụ mentor</li>';

    return this.sendEmail({
      to: user.email,
      subject: `Xác nhận thanh toán thành công - FPTAIEZ`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 60px; text-align: center; margin: 20px 0; }
            .receipt { background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .receipt-row:last-child { border-bottom: none; }
            .amount { font-size: 24px; color: #27ae60; font-weight: bold; }
            .documents-list { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .transaction-code { background: #e8f5e9; padding: 10px 15px; border-radius: 5px; font-family: monospace; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">&#10004;</div>
              <h1>Thanh toán thành công!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name}</strong>,</p>
              <p>Cảm ơn bạn đã sử dụng dịch vụ của FPTAIEZ. Dưới đây là chi tiết giao dịch:</p>
              
              <div class="receipt">
                <h3 style="margin-top: 0; color: #667eea;">Phiếu thanh toán</h3>
                <div class="receipt-row">
                  <span>Mã giao dịch:</span>
                  <span class="transaction-code">${transactionCode}</span>
                </div>
                <div class="receipt-row">
                  <span>Mã đơn hàng:</span>
                  <span>${orderId}</span>
                </div>
                <div class="receipt-row">
                  <span>Ngày thanh toán:</span>
                  <span>${formattedDate}</span>
                </div>
                <div class="receipt-row">
                  <span>Phương thức:</span>
                  <span>${method === 'vnpay' ? 'VNPay' : method === 'momo' ? 'MoMo' : method === 'banking' ? 'Chuyển khoản' : 'Thẻ tín dụng'}</span>
                </div>
                <div class="receipt-row">
                  <span><strong>Sản phẩm:</strong></span>
                </div>
                <div class="documents-list">
                  <ul style="margin: 0; padding-left: 20px;">
                    ${documentsList}
                  </ul>
                </div>
                <div class="receipt-row">
                  <span><strong>Tổng cộng:</strong></span>
                  <span class="amount">${formattedAmount} VNĐ</span>
                </div>
              </div>

              <p style="background: #fff3cd; padding: 15px; border-radius: 5px;">
                <strong>Lưu giữ phiếu này:</strong> Vui lòng lưu giữ mã giao dịch <strong>${transactionCode}</strong> để làm bằng chứng thanh toán.
              </p>

              <div style="text-align: center;">
                <a href="${config.clientUrl}/profile" class="button">Xem lịch sử giao dịch</a>
              </div>
            </div>
            <div class="footer">
              <p>Nếu bạn có thắc mắc, vui lòng liên hệ support@fptaiez.com</p>
              <p>FPTAIEZ - Học tập thông minh, thành công bền vững</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendMentorBookingConfirmation(user, bookingDetails) {
    const { mentorName, subject, date, startTime, endTime, duration, amount, transactionCode } = bookingDetails;
    
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
    const formattedDate = new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return this.sendEmail({
      to: user.email,
      subject: `Xác nhận đặt Mentor - FPTAIEZ`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-card { background: white; border-radius: 10px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; min-width: 120px; }
            .info-value { font-weight: 600; }
            .calendar-icon { text-align: center; font-size: 40px; margin: 10px 0; }
            .amount { font-size: 28px; color: #9b59b6; font-weight: bold; text-align: center; margin: 20px 0; }
            .button { display: inline-block; background: #9b59b6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="calendar-icon">&#128197;</div>
              <h1>Xác nhận đặt Mentor</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name}</strong>,</p>
              <p>Bạn đã đặt lịch mentor thành công. Dưới đây là thông tin buổi học:</p>
              
              <div class="booking-card">
                <h3 style="margin-top: 0; color: #9b59b6;">Thông tin buổi học</h3>
                <div class="info-row">
                  <span class="info-label">Mentor:</span>
                  <span class="info-value">${mentorName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Môn học:</span>
                  <span class="info-value">${subject}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ngày:</span>
                  <span class="info-value">${formattedDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Giờ:</span>
                  <span class="info-value">${startTime} - ${endTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Thời lượng:</span>
                  <span class="info-value">${duration} phút</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mã giao dịch:</span>
                  <span style="font-family: monospace;">${transactionCode}</span>
                </div>
              </div>

              <div class="amount">${formattedAmount} VNĐ</div>

              <p style="background: #e8f5e9; padding: 15px; border-radius: 5px;">
                <strong>Nhắc nhở:</strong> Vui lòng đăng nhập đúng giờ và chuẩn bị câu hỏi trước buổi học với mentor.
              </p>

              <div style="text-align: center;">
                <a href="${config.clientUrl}/mentors" class="button">Xem lịch sử đặt mentor</a>
              </div>
            </div>
            <div class="footer">
              <p>Nếu bạn cần hủy lịch, vui lòng thông báo trước 24 giờ.</p>
              <p>FPTAIEZ - Học tập thông minh, thành công bền vững</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendPaymentFailedNotification(user, paymentDetails) {
    const { orderId, amount, reason } = paymentDetails;
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);

    return this.sendEmail({
      to: user.email,
      subject: `Thanh toán không thành công - FPTAIEZ`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .error-box { background: #fdecea; border-left: 4px solid #e74c3c; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thanh toán không thành công</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${user.name}</strong>,</p>
              <p>Rất tiếc, giao dịch của bạn không thể hoàn tất:</p>
              
              <div class="error-box">
                <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
                <p><strong>Số tiền:</strong> ${formattedAmount} VNĐ</p>
                <p><strong>Lý do:</strong> ${reason || 'Giao dịch bị từ chối bởi cổng thanh toán'}</p>
              </div>

              <p>Bạn có thể thử lại hoặc liên hệ với chúng tôi để được hỗ trợ.</p>

              <div style="text-align: center;">
                <a href="${config.clientUrl}/marketplace" class="button">Thử lại thanh toán</a>
              </div>
            </div>
            <div class="footer">
              <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ support@fptaiez.com</p>
              <p>FPTAIEZ - Học tập thông minh</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}

export default new EmailService();
