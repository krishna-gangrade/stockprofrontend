import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';

interface ApiDocLink {
  name: string;
  swaggerUi: string;
  apiDocs: string;
}

interface DocsEndpointResponse {
  gatewaySwaggerUi?: string;
  services?: ApiDocLink[];
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

    <div *ngIf="loadError" class="alert alert-warning border-0 shadow-sm">
      <div class="fw-semibold mb-1">Using fallback API docs links</div>
      <span>{{ loadError }}</span>
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
  private readonly http = inject(HttpClient);

  readonly gatewayBaseUrl = environment.apiUrl.startsWith('http')
    ? environment.apiUrl.replace(/\/api\/v1$/, '')
    : window.location.origin;

  gatewaySwaggerUi = `${this.gatewayBaseUrl}/swagger-ui.html`;
  docs: ApiDocLink[] = this.buildFallbackDocs();
  loadError = '';

  constructor() {
    this.http.get<DocsEndpointResponse>('/docs/endpoints').subscribe({
      next: (response) => {
        if (response.gatewaySwaggerUi) {
          this.gatewaySwaggerUi = response.gatewaySwaggerUi;
        }

        if (response.services?.length) {
          this.docs = response.services;
        }
      },
      error: () => {
        this.loadError = 'The gateway docs index did not respond, so these links were generated locally.';
      }
    });
  }

  private buildFallbackDocs(): ApiDocLink[] {
    return [
      this.fallbackLink('Auth Service', 'auth'),
      this.fallbackLink('Product Service', 'products'),
      this.fallbackLink('Warehouse Service', 'warehouses'),
      this.fallbackLink('Purchase Service', 'purchases'),
      this.fallbackLink('Payment Service', 'payments'),
      this.fallbackLink('Supplier Service', 'suppliers'),
      this.fallbackLink('Movement Service', 'movements'),
      this.fallbackLink('Alert Service', 'alerts'),
      this.fallbackLink('Report Service', 'reports')
    ];
  }

  private fallbackLink(name: string, slug: string): ApiDocLink {
    const apiDocs = `${this.gatewayBaseUrl}/docs/${slug}/v3/api-docs`;
    return {
      name,
      swaggerUi: `${this.gatewayBaseUrl}/docs/${slug}/swagger-ui`,
      apiDocs
    };
  }
}
