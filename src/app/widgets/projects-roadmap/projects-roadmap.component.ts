import { Component, HostListener } from '@angular/core';
import { ProjectsRoadmapService } from './projects-roadmap.service';

@Component({
    selector: 'app-projects-roadmap:not(1)',
    imports: [],
    templateUrl: './projects-roadmap.component.html',
    styleUrl: './projects-roadmap.component.scss'
})
export class ProjectsRoadmapComponent {

    selectedTimeframe: string = 'This Week'; // Default dropdown text
    chartData: { [key: string]: { series: { name: string; data: number[] }[]; categories: string[] } };

    constructor(
        private projectsRoadmapService: ProjectsRoadmapService
    ) {
        // Define the data for each timeframe
        this.chartData = {
            'This Day': {
                series: [{ name: 'Projects', data: [100, 150, 200, 250, 300, 350, 400] }],
                categories: ['Planning', 'Research', 'Design', 'Front-end', 'Development', 'QA', 'Launch']
            },
            'This Week': {
                series: [{ name: 'Projects', data: [400, 550, 600, 700, 1000, 1100, 1200] }],
                categories: ['Project Planning', 'Research', 'Design', 'Front-end', 'Development', 'Review & QA', 'Launch']
            },
            'This Month': {
                series: [{ name: 'Projects', data: [1200, 1500, 1700, 2000, 2200, 2500, 3000] }],
                categories: ['Concept', 'UX Research', 'Wireframing', 'UI Design', 'Development', 'Testing', 'Delivery']
            },
            'This Year': {
                series: [{ name: 'Projects', data: [5000, 6000, 7000, 8000, 9000, 10000, 12000] }],
                categories: ['Q1', 'Q2', 'Q3', 'Q4', 'Deployment', 'Support', 'Maintenance']
            }
        };
    }

    ngOnInit(): void {
        // Load the default chart
        const defaultData = this.chartData[this.selectedTimeframe];
        this.projectsRoadmapService.loadChart(defaultData.series, defaultData.categories);
    }

    onTimeframeChange(timeframe: string): void {
        this.selectedTimeframe = timeframe; // Update button text
        const selectedData = this.chartData[timeframe];
        this.projectsRoadmapService.updateChart(selectedData.series, selectedData.categories);
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