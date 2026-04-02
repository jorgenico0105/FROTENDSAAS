import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-fluid-bg',
  standalone: true,
  template: `<canvas #canvas style="position:fixed;inset:0;width:100%;height:100%;display:block;"></canvas>`,
})
export class FluidBgComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animId = 0;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private startTime = 0;
  private uTime: WebGLUniformLocation | null = null;
  private uRes: WebGLUniformLocation | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.init();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animId);
    }
  }

  private init(): void {
    const canvas = this.canvasRef.nativeElement;
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return;
    this.gl = gl;

    const vs = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    // Simplex-noise fluid using the warm organic palette
    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2  u_res;

      // ---- palette ----
      // #1C1510  ESPRESSO
      // #3A2920  DARK WALNUT
      // #D7A49A  DUSTY ROSE
      // #E4C9B6  NUDE
      // #8B9E81  SAGE

      // ---- simplex 2D ----
      vec3 _mod289v3(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
      vec2 _mod289v2(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
      vec3 _permute(vec3 x){ return _mod289v3(((x*34.0)+1.0)*x); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1  = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy  -= i1;
        i = _mod289v2(i);
        vec3 p = _permute(_permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0),
                                dot(x12.xy,x12.xy),
                                dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 xv = 2.0*fract(p*C.www) - 1.0;
        vec3 h  = abs(xv) - 0.5;
        vec3 ox = floor(xv + 0.5);
        vec3 a0 = xv - ox;
        m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
        vec3 gv;
        gv.x  = a0.x *x0.x  + h.x *x0.y;
        gv.yz = a0.yz*x12.xz + h.yz*x12.yw;
        return 130.0*dot(m, gv);
      }

      // fbm – fewer octaves so shapes stay large
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for(int i=0; i<3; i++){
          v += a * snoise(p);
          p  = p * 2.0 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        float t  = u_time * 0.10;

        // low-frequency scale = large, close waves
        vec2 q = vec2(fbm(uv*0.6 + vec2(t*0.4, t*0.25)),
                      fbm(uv*0.6 + vec2(t*0.3 + 5.2, t*0.45 + 1.3)));

        vec2 r = vec2(fbm(uv*0.55 + 2.5*q + vec2(1.7+t*0.12, 9.2+t*0.08)),
                      fbm(uv*0.55 + 2.5*q + vec2(8.3+t*0.10, 2.8+t*0.11)));

        float f = fbm(uv*0.5 + 2.5*r);
        f = 0.5 + 0.5*f;   // remap to [0,1]

        // palette stops — white peak added at top
        vec3 col0 = vec3(0.969, 0.937, 0.910); // #F7EFE8 Linen
        vec3 col1 = vec3(0.894, 0.788, 0.714); // #E4C9B6 Nude
        vec3 col2 = vec3(0.843, 0.643, 0.604); // #D7A49A Dusty Rose
        vec3 col3 = vec3(0.545, 0.620, 0.506); // #8B9E81 Sage
        vec3 col4 = vec3(0.894, 0.788, 0.714); // #E4C9B6 Nude again
        vec3 col5 = vec3(1.00,  0.98,  0.97);  // warm white

        // gradient across palette (6 stops → 5 bands of 0.2 each)
        vec3 col;
        if(f < 0.20)      col = mix(col0, col1, f*5.0);
        else if(f < 0.40) col = mix(col1, col2, (f-0.20)*5.0);
        else if(f < 0.60) col = mix(col2, col3, (f-0.40)*5.0);
        else if(f < 0.80) col = mix(col3, col4, (f-0.60)*5.0);
        else               col = mix(col4, col5, (f-0.80)*5.0);

        // darken at edges for vignette
        vec2 vd = uv - 0.5;
        float vig = 1.0 - dot(vd, vd)*1.6;
        col *= clamp(vig, 0.4, 1.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const vert = this.compileShader(gl, gl.VERTEX_SHADER, vs);
    const frag = this.compileShader(gl, gl.FRAGMENT_SHADER, fs);
    if (!vert || !frag) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }

    this.program = prog;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.uTime = gl.getUniformLocation(prog, 'u_time');
    this.uRes  = gl.getUniformLocation(prog, 'u_res');

    this.startTime = performance.now();
    this.render();
  }

  private compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  private render(): void {
    const gl = this.gl;
    if (!gl || !this.program) return;
    const canvas = this.canvasRef.nativeElement;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    const t = (performance.now() - this.startTime) / 1000;
    gl.uniform1f(this.uTime, t);
    gl.uniform2f(this.uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.animId = requestAnimationFrame(() => this.render());
  }
}
