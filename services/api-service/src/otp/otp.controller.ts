import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OtpService } from './otp.service';
import { GenerateOtpDto, VerifyOtpDto } from './dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('generate')
  async generateOtp(@Body() generateOtpDto: GenerateOtpDto) {
    try {
      const { phone } = generateOtpDto;
      const result = await this.otpService.generateOtp(phone);
      return {
        message: result.userCreated ? 'User created and OTP sent successfully' : 'OTP sent successfully',
        expiresIn: result.expiresIn,
        userCreated: result.userCreated,
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw error;
    }
  }

  @Post('verify')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const { phone, code } = verifyOtpDto;
    const isValid = await this.otpService.verifyOtp(phone, code);
    
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid or expired OTP',
      };
    }

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  @Get('status/:phone')
  async getOtpStatus(@Param('phone') phone: string) {
    const exists = await this.otpService.checkOtpExists(phone);
    return {
      hasActiveOtp: exists,
    };
  }
}

