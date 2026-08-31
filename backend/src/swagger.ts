import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('OficiosYa API')
    .setDescription(
      'Documentación REST de OficiosYa: autenticación, recuperación de acceso y recursos del modelo de datos.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token devuelto por /api/auth/login',
      },
      'access-token',
    )
    .addTag('Auth', 'Registro, login, sesión y recuperación de contraseña')
    .addTag('Worker', 'Perfil del trabajador, tarifas, horarios, cobertura y disponibilidad')
    .addTag('Admin', 'Moderación de cuentas')
    .addTag('usuarios')
    .addTag('zonas')
    .addTag('perfiles-trabajador')
    .addTag('perfiles-zona')
    .addTag('portafolio')
    .addTag('reportes')
    .addTag('bitacora')
    .addTag('categorias')
    .addTag('servicios')
    .addTag('solicitudes')
    .addTag('cotizaciones')
    .addTag('mensajes')
    .addTag('resenas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
