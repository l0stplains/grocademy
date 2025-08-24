import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  SuccessResponse,
  SuccessResponseWithPagination,
  Paginated,
} from './response-wrappers';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Grocademy API')
    .setDescription('REST API docs')
    .setVersion('1.0.0')
    // both cookie (HttpOnly) and bearer supported
    .addCookieAuth('token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'token',
      description: 'JWT in HttpOnly cookie set by /api/auth/login',
    })
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addServer('https://grocademy.store', 'Live')
    .addServer('http://localhost:3000', 'Local (direct)')
    .build();

  const doc = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [SuccessResponse, SuccessResponseWithPagination, Paginated],
  });

  SwaggerModule.setup('/docs', app, doc, {
    customSiteTitle: 'Grocademy API Docs',
    customfavIcon: '/static/assets/img/logo.webp',
    jsonDocumentUrl: '/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customCss: `
    :root {
      --blue: #0A75BC;
      --blue-600: #075a91;
      --yellow: #FCE029;
      --yellow-700: #c9b01e;
      --black: #231F20;
      --brown: #A87A51;
      --white: #fff;
      --gray: #949699;
      --gray-200: #f2f3f5;
      --gray-300: #e6e8eb;
      --gray-500: #6e7073;
      --shadow: 0 6px 24px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06);
      --radius: 18px;
      --radius-sm: 12px;
      --radius-lg: 26px;
      --container: 1120px;
      --focus: 0 0 0 3px rgba(10,117,188,.25);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      background-color: var(--gray-200) !important;
    }

    .swagger-ui {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    }

    .topbar {
      background: var(--blue) !important;
      border-bottom: 1px solid var(--blue-600) !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }

    .topbar-wrapper {
      max-width: var(--container) !important;
      margin: 0 auto !important;
      padding: 12px 20px !important;
      display: flex !important;
      align-items: center !important;
    }

    .topbar-wrapper .link {
      display: flex !important;
      align-items: center !important;
      text-decoration: none !important;
    }

    .topbar-wrapper .link::before {
      content: '';
      display: inline-block;
      width: 64px;
      height: 64px;
      margin-right: 24px;
      background-image: url('/static/assets/img/logo.webp');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .topbar-wrapper .link span {
      color: var(--white) !important;
      font-weight: 600 !important;
      font-size: 1.25rem !important;
    }

    .swagger-ui .wrapper {
      max-width: var(--container) !important;
      margin: 0 auto !important;
      padding: 20px !important;
    }

    .swagger-ui .info {
      background: var(--white) !important;
      border: 1px solid var(--gray-300) !important;
      border-radius: var(--radius-sm) !important;
      padding: 24px !important;
      margin-bottom: 24px !important;
      box-shadow: var(--shadow) !important;
    }

    .swagger-ui .info .title {
      color: var(--black) !important;
      font-weight: 700 !important;
      font-size: 2rem !important;
      margin-bottom: 12px !important;
    }

    .swagger-ui .info .description {
      color: var(--gray-500) !important;
      line-height: 1.6 !important;
    }

    .swagger-ui .btn.authorize {
      background-color: var(--blue) !important;
      border-color: var(--blue) !important;
      color: var(--white) !important;
      font-weight: 600 !important;
      border-radius: var(--radius-sm) !important;
      padding: 8px 16px !important;
      transition: all 0.2s ease !important;
    }

    .swagger-ui .btn.authorize:hover {
      background-color: var(--blue-600) !important;
      border-color: var(--blue-600) !important;
    }

    /* Operation blocks - clean styling */
    .swagger-ui .opblock {
      border: 1px solid var(--gray-300) !important;
      border-radius: var(--radius-sm) !important;
      margin-bottom: 16px !important;
      background: var(--white) !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04) !important;
    }

    .swagger-ui .opblock.opblock-get {
      border-left: 4px solid var(--blue) !important;
    }

    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: var(--blue) !important;
      color: var(--white) !important;
    }

    .swagger-ui .opblock.opblock-post {
      border-left: 4px solid var(--yellow-700) !important;
    }

    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: var(--yellow-700) !important;
      color: var(--white) !important;
    }

    .swagger-ui .opblock.opblock-put {
      border-left: 4px solid var(--brown) !important;
    }

    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: var(--brown) !important;
      color: var(--white) !important;
    }

    .swagger-ui .opblock.opblock-delete {
      border-left: 4px solid #e74c3c !important;
    }

    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #e74c3c !important;
      color: var(--white) !important;
    }

    .swagger-ui .opblock.opblock-patch {
      border-left: 4px solid #50e3c2 !important;
    }

    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: #50e3c2 !important;
      color: var(--black) !important;
    }

    .swagger-ui .opblock-summary-method {
      border-radius: 4px !important;
      font-weight: 700 !important;
      font-size: 12px !important;
      text-transform: uppercase !important;
      min-width: 80px !important;
      text-align: center !important;
    }

    .swagger-ui .opblock-summary {
      padding: 16px 20px !important;
    }

    .swagger-ui .opblock-summary-path {
      font-weight: 600 !important;
      color: var(--black) !important;
      font-size: 16px !important;
    }

    .swagger-ui .opblock-summary-description {
      color: var(--gray-500) !important;
    }

    .swagger-ui .btn.try-out__btn {
      background: var(--yellow) !important;
      border: 1px solid var(--yellow-700) !important;
      color: var(--black) !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      transition: all 0.2s ease !important;
    }

    .swagger-ui .btn.try-out__btn:hover {
      background: var(--yellow-700) !important;
      color: var(--white) !important;
    }

    .swagger-ui .btn.execute {
      background-color: var(--blue) !important;
      border-color: var(--blue) !important;
      color: var(--white) !important;
      font-weight: 600 !important;
      border-radius: 4px !important;
      transition: all 0.2s ease !important;
    }

    .swagger-ui .btn.execute:hover {
      background-color: var(--blue-600) !important;
      border-color: var(--blue-600) !important;
    }

    .swagger-ui .opblock-tag {
      background: var(--gray-200) !important;
      color: var(--black) !important;
      padding: 12px 20px !important;
      border-radius: var(--radius-sm) !important;
      margin-bottom: 16px !important;
      border: 1px solid var(--gray-300) !important;
      font-weight: 600 !important;
      font-size: 18px !important;
    }

    .swagger-ui .parameters-container {
      background: var(--white) !important;
      padding: 20px !important;
    }

    .swagger-ui .response-wrapper {
      background: var(--gray-200) !important;
      border-radius: var(--radius-sm) !important;
      padding: 16px !important;
      margin-top: 16px !important;
    }

    .swagger-ui .response {
      background: var(--white) !important;
      border: 1px solid var(--gray-300) !important;
      border-radius: 4px !important;
    }

    .swagger-ui input[type=text], 
    .swagger-ui input[type=password], 
    .swagger-ui input[type=search], 
    .swagger-ui input[type=email], 
    .swagger-ui input[type=url],
    .swagger-ui textarea,
    .swagger-ui select {
      border: 1px solid var(--gray-300) !important;
      border-radius: 4px !important;
      padding: 8px 12px !important;
      font-size: 14px !important;
      transition: border-color 0.2s ease !important;
    }

    .swagger-ui input[type=text]:focus, 
    .swagger-ui input[type=password]:focus, 
    .swagger-ui input[type=search]:focus, 
    .swagger-ui input[type=email]:focus, 
    .swagger-ui input[type=url]:focus,
    .swagger-ui textarea:focus,
    .swagger-ui select:focus {
      border-color: var(--blue) !important;
      box-shadow: var(--focus) !important;
      outline: none !important;
    }

    .swagger-ui table thead tr th {
      background: var(--gray-200) !important;
      color: var(--black) !important;
      font-weight: 600 !important;
      border-bottom: 1px solid var(--gray-300) !important;
      padding: 12px 8px !important;
    }

    .swagger-ui table tbody tr td {
      border-bottom: 1px solid var(--gray-300) !important;
      padding: 12px 8px !important;
      vertical-align: top !important;
    }

    .swagger-ui .highlight-code {
      background: #2d3748 !important;
      border: 1px solid var(--gray-300) !important;
      border-radius: 4px !important;
    }

    .swagger-ui .model-box {
      background: var(--white) !important;
      border: 1px solid var(--gray-300) !important;
      border-radius: 4px !important;
    }

    .swagger-ui .model-title {
      color: var(--blue) !important;
      font-weight: 600 !important;
    }

    .swagger-ui .dialog-ux .modal-ux {
      border-radius: var(--radius-sm) !important;
      box-shadow: var(--shadow) !important;
    }

    .swagger-ui .dialog-ux .modal-ux-header {
      background: var(--blue) !important;
      color: var(--white) !important;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important;
    }

    .swagger-ui .scheme-container {
      background: var(--white) !important;
      border: 1px solid var(--gray-300) !important;
      border-radius: var(--radius-sm) !important;
      padding: 16px !important;
      margin-bottom: 20px !important;
    }

    .swagger-ui .response-col_status {
      font-weight: 600 !important;
    }

    .swagger-ui .response-col_status.response-col_200 {
      color: #27ae60 !important;
    }

    .swagger-ui .response-col_status.response-col_400 {
      color: #e74c3c !important;
    }

    .swagger-ui .response-col_status.response-col_500 {
      color: #e67e22 !important;
    }

    .swagger-ui .loading-container .loading::after {
      border-top-color: var(--blue) !important;
    }

    @media (max-width: 768px) {
      .swagger-ui .wrapper {
        padding: 12px !important;
      }
      
      .topbar-wrapper {
        padding: 12px 16px !important;
      }
      
      .swagger-ui .info {
        padding: 16px !important;
      }
      
      .swagger-ui .info .title {
        font-size: 1.5rem !important;
      }
    }
  `,
  });
}
