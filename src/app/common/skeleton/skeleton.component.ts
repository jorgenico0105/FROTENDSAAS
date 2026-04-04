import { Component, Input } from '@angular/core';

export type SkeletonType = 'table' | 'cards' | 'dashboard' | 'detail' | 'detail-tabs' | 'list';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="animate-pulse">

      <!-- ═══ TABLE ═══════════════════════════════════════════════════════ -->
      @if (type === 'table') {
        <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] overflow-hidden shadow-sm">
          <!-- Toolbar -->
          <div class="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#172036]">
            <div class="h-8 w-52 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
            <div class="flex gap-2">
              <div class="h-8 w-24 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
              <div class="h-8 w-28 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
          <!-- Header row -->
          <div class="grid px-5 py-3 gap-4 border-b border-gray-100 dark:border-[#172036]"
               [style.grid-template-columns]="'repeat(' + cols + ', minmax(0, 1fr))'">
            @for (_ of colArray; track $index) {
              <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 w-3/4"></div>
            }
          </div>
          <!-- Rows -->
          @for (_ of rowArray; track $index) {
            <div class="grid px-5 py-4 gap-4 items-center border-b border-gray-50 dark:border-[#172036]/50 last:border-0"
                 [style.grid-template-columns]="'repeat(' + cols + ', minmax(0, 1fr))'">
              <!-- First col: avatar + text -->
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                <div class="flex-1 space-y-1.5">
                  <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 w-4/5"></div>
                  <div class="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 w-3/5"></div>
                </div>
              </div>
              <!-- Remaining cols -->
              @for (_ of colArray.slice(1); track $index) {
                <div class="h-3 rounded-full bg-gray-100 dark:bg-gray-800"
                     [style.width]="($index % 2 === 0 ? '70%' : '55%')"></div>
              }
            </div>
          }
        </div>
      }

      <!-- ═══ CARDS ════════════════════════════════════════════════════════ -->
      @if (type === 'cards') {
        <!-- Filter bar -->
        <div class="flex items-center gap-3 mb-5">
          <div class="h-9 w-56 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-9 w-32 rounded-xl bg-gray-200 dark:bg-gray-700 ml-auto"></div>
          <div class="h-9 w-28 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <!-- Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (_ of rowArray; track $index) {
            <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] overflow-hidden shadow-sm">
              <!-- Colored header -->
              <div class="px-5 pt-5 pb-4 flex items-start gap-3 bg-gray-50 dark:bg-[#0a0e19]">
                <div class="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                <div class="flex-1 pt-0.5 space-y-2">
                  <div class="h-3 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div class="h-2.5 w-24 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                </div>
              </div>
              <!-- Body -->
              <div class="px-5 py-4 space-y-2 border-t border-gray-50 dark:border-[#172036]">
                <div class="h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 w-4/5"></div>
                <div class="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 w-full"></div>
                <div class="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 w-3/4"></div>
              </div>
              <!-- Footer -->
              <div class="px-5 pb-4 pt-2 flex items-center justify-between border-t border-gray-50 dark:border-[#172036]">
                <div class="h-2.5 w-20 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                <div class="h-6 w-20 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ═══ DASHBOARD ════════════════════════════════════════════════════ -->
      @if (type === 'dashboard') {
        <!-- Stats row -->
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          @for (_ of [0,1,2,3]; track $index) {
            <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-5 shadow-sm">
              <div class="flex items-start justify-between mb-4">
                <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                <div class="h-5 w-14 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
              </div>
              <div class="h-7 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 mb-1.5"></div>
              <div class="h-3 w-24 rounded-full bg-gray-100 dark:bg-gray-800"></div>
            </div>
          }
        </div>
        <!-- Chart row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          @for (_ of [0,1]; track $index) {
            <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-5 shadow-sm">
              <div class="h-3.5 w-32 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
              <div class="h-48 rounded-xl bg-gray-100 dark:bg-gray-800"></div>
            </div>
          }
        </div>
        <!-- List section -->
        <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-[#172036]">
            <div class="h-3.5 w-28 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          </div>
          @for (_ of rowArray; track $index) {
            <div class="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-[#172036]/50 last:border-0">
              <div class="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 w-3/5"></div>
                <div class="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 w-2/5"></div>
              </div>
              <div class="h-6 w-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            </div>
          }
        </div>
      }

      <!-- ═══ DETAIL ════════════════════════════════════════════════════════ -->
      @if (type === 'detail') {
        <!-- Header card -->
        <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-6 shadow-sm mb-5">
          <div class="flex items-center gap-5">
            <div class="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-40 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div class="h-3 w-60 rounded-full bg-gray-100 dark:bg-gray-800"></div>
              <div class="flex gap-3">
                <div class="h-5 w-20 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
                <div class="h-5 w-24 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
              </div>
            </div>
            <div class="h-9 w-24 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
        <!-- Content cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          @for (_ of [0,1]; track $index) {
            <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-5 shadow-sm space-y-3">
              <div class="h-3.5 w-28 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
              @for (_ of [0,1,2,3]; track $index) {
                <div class="flex justify-between items-center py-1 border-b border-gray-50 dark:border-[#172036] last:border-0">
                  <div class="h-3 w-24 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                  <div class="h-3 w-28 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
              }
            </div>
          }
        </div>
        <!-- Wide card -->
        <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-5 shadow-sm">
          <div class="h-3.5 w-32 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
          @for (_ of rowArray; track $index) {
            <div class="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-[#172036] last:border-0">
              <div class="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 w-2/3"></div>
                <div class="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 w-2/5"></div>
              </div>
              <div class="h-5 w-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            </div>
          }
        </div>
      }

      <!-- ═══ DETAIL-TABS ══════════════════════════════════════════════════ -->
      @if (type === 'detail-tabs') {
        <!-- Header card -->
        <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-5 shadow-sm mb-5">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-36 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div class="h-3 w-52 rounded-full bg-gray-100 dark:bg-gray-800"></div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              @for (_ of [0,1,2]; track $index) {
                <div class="text-center space-y-1">
                  <div class="h-5 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 mx-auto"></div>
                  <div class="h-2.5 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto"></div>
                </div>
              }
            </div>
          </div>
        </div>
        <!-- Tab bar -->
        <div class="flex gap-2 mb-5">
          @for (_ of [0,1,2,3]; track $index) {
            <div class="h-9 rounded-xl bg-gray-200 dark:bg-gray-700"
                 [style.width]="$index === 0 ? '90px' : '80px'"></div>
          }
        </div>
        <!-- Tab content -->
        <div class="space-y-3">
          @for (_ of rowArray; track $index) {
            <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-4 shadow-sm flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 w-3/5"></div>
                <div class="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 w-2/5"></div>
              </div>
              <div class="h-6 w-20 rounded-xl bg-gray-100 dark:bg-gray-800"></div>
              <div class="h-8 w-8 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
            </div>
          }
        </div>
      }

      <!-- ═══ LIST ═════════════════════════════════════════════════════════ -->
      @if (type === 'list') {
        <!-- Search bar -->
        <div class="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700 mb-5"></div>
        <!-- Items -->
        <div class="space-y-3">
          @for (_ of rowArray; track $index) {
            <div class="bg-white dark:bg-[#0c1427] rounded-2xl border border-gray-100 dark:border-[#1b2c4f] p-4 shadow-sm flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3 rounded-full bg-gray-200 dark:bg-gray-700 w-3/5"></div>
                <div class="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 w-2/5"></div>
              </div>
              <div class="h-6 w-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class SkeletonComponent {
  @Input() type: SkeletonType = 'table';
  @Input() rows = 6;
  @Input() cols = 4;

  get rowArray(): number[] { return Array(this.rows).fill(0); }
  get colArray(): number[] { return Array(this.cols).fill(0); }
}
