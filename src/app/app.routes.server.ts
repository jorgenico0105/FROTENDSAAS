import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // Auth-protected pages rendered on the client to avoid 401s (no token on server)
    { path: 'dashboard/**', renderMode: RenderMode.Client },
    {
        path: '**',
        renderMode: RenderMode.Prerender
    }
];
