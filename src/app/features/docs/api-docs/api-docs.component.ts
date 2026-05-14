import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

interface ApiDocLink {
  name: string;
  swaggerUi: string;
  apiDocs: string;
}

@Component({
  selector: 'app-api-docs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h2 class="fw-bold mb-1"><i class="bi bi-journal-code text-primary me-2"></i>API Documentation</h2>
        <p class="text-muted mb-0">One place for all Swagger UI and OpenAPI links routed through the gateway.</p>
      </div>
      <a class="btn btn-dark" [href]="gatewaySwaggerUi" target="_blank" rel="noopener">
        <i class="bi bi-box-arrow-up-right me-2"></i>Open Gateway Swagger
      </a>
    </div>

    <div class="alert alert-info border-0 shadow-sm">
      <div class="fw-semibold mb-1">Gateway base URL</div>
      <code>{{ gatewayBaseUrl }}</code>
    </div>

    <div class="row g-3">
      <div class="col-lg-4 col-md-6" *ngFor="let doc of docs">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="fw-bold mb-2">{{ doc.name }}</h5>
            <p class="text-muted small mb-3">Swagger UI and raw OpenAPI spec exposed via the API gateway.</p>
            <div class="mt-auto d-grid gap-2">
              <a class="btn btn-outline-dark" [href]="doc.swaggerUi" target="_blank" rel="noopener">Swagger UI</a>
              <a class="btn btn-outline-primary" [href]="doc.apiDocs" target="_blank" rel="noopener">OpenAPI JSON</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApiDocsComponent {
  readonly gatewayBaseUrl = environment.apiUrl.startsWith('http')
    ? environment.apiUrl.replace(/\/api\/v1$/, '')
    : window.location.origin;
  readonly gatewaySwaggerUi = `${this.gatewayBaseUrl}/swagger-ui.html`;

  readonly docs: ApiDocLink[] = [
    this.link('Auth Service', 'auth'),
    this.link('Product Service', 'products'),
    this.link('Warehouse Service', 'warehouses'),
    this.link('Purchase Service', 'purchases'),
    this.link('Payment Service', 'payments'),
    this.link('Supplier Service', 'suppliers'),
    this.link('Movement Service', 'movements'),
    this.link('Alert Service', 'alerts'),
    this.link('Report Service', 'reports')
  ];

  private link(name: string, slug: string): ApiDocLink {
    return {
      name,
      // Route service cards through the gateway's aggregated Swagger UI to avoid
      // downstream springdoc redirects escaping the /docs/{service} proxy path.
      swaggerUi: `${this.gatewaySwaggerUi}?urls.primaryName=${encodeURIComponent(name)}`,
      apiDocs: `${this.gatewayBaseUrl}/docs/${slug}/v3/api-docs`
    };
  }
}
