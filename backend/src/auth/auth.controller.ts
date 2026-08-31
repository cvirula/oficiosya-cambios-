import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsuarioRow } from '../common/usuario.util';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { ResendVerificationDto, VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('auth/logout')
  logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
    return this.authService.logout(token);
  }

  @Post('auth/refresh-token')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UsuarioRow) {
    return this.authService.me(user);
  }

  @Post('auth/forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('auth/reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('auth/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: UsuarioRow, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user, dto);
  }

  @Post('auth/verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('auth/resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Patch('auth/deactivate')
  @UseGuards(JwtAuthGuard)
  deactivate(@CurrentUser() user: UsuarioRow) {
    return this.authService.deactivate(user);
  }

  @Patch('auth/reactivate')
  @UseGuards(JwtAuthGuard)
  reactivate(@CurrentUser() user: UsuarioRow) {
    return this.authService.reactivate(user);
  }

  @Delete('auth/account')
  @UseGuards(JwtAuthGuard)
  deleteAccount(@CurrentUser() user: UsuarioRow) {
    return this.authService.deleteAccount(user);
  }

  @Patch('admin/usuarios/:id/estado')
  @UseGuards(JwtAuthGuard)
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
  ) {
    return this.authService.updateEstado(id, dto.estado);
  }
}
