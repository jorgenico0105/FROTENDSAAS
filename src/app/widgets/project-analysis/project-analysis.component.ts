import { Component, HostListener } from '@angular/core';
import { ProjectAnalysisService } from './project-analysis.service';

@Component({
    selector: 'app-project-analysis:not(1)',
    imports: [],
    templateUrl: './project-analysis.component.html',
    styleUrl: './project-analysis.component.scss'
})
export class ProjectAnalysisComponent {

    constructor(
        private projectAnalysisService: ProjectAnalysisService
    ) {}

    ngOnInit(): void {
        this.projectAnalysisService.loadChart();
    }

    // Card Header Menu
    isCardHeaderOpen = false;
    toggleCardHeaderMenu() {
        this.isCardHeaderOpen = !this.isCardHeaderOpen;
    }
    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.trezo-card-dropdown')) {
            this.isCardHeaderOpen = false;
        }
    }

}