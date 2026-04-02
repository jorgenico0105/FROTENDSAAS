import { Component, HostListener } from '@angular/core';
import { MpOverviewService } from './mp-overview.service';

@Component({
    selector: 'app-mp-overview',
    imports: [],
    templateUrl: './mp-overview.component.html',
    styleUrl: './mp-overview.component.scss'
})
export class MpOverviewComponent {

    selectedTimeframe: string = 'Last Week'; // Default dropdown text
    chartData: { [key: string]: { series: { name: string; data: number[] }[]; categories: string[] } };

    constructor(
        private mpOverviewService: MpOverviewService
    ) {
        // Define the data for each timeframe
        this.chartData = {
            'Last Day': {
                series: [
                    { name: 'Budgets', data: [40] },
                    { name: 'Expenses', data: [15] },
                    { name: 'Revenue', data: [55] }
                ],
                categories: ['Today']
            },
            'Last Week': {
                series: [
                    { name: 'Budgets', data: [40, 60, 55, 30, 60, 130, 63] },
                    { name: 'Expenses', data: [15, 65, 100, 40, 90, 90, 91] },
                    { name: 'Revenue', data: [55, 70, 30, 50, 110, 60, 52] }
                ],
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            'Last Month': {
                series: [
                    { name: 'Budgets', data: [150, 200, 250, 300] },
                    { name: 'Expenses', data: [100, 150, 200, 250] },
                    { name: 'Revenue', data: [200, 250, 300, 350] }
                ],
                categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
            },
            'Last Year': {
                series: [
                    { name: 'Budgets', data: [500, 600, 700, 800] },
                    { name: 'Expenses', data: [400, 500, 600, 700] },
                    { name: 'Revenue', data: [600, 700, 800, 900] }
                ],
                categories: ['Q1', 'Q2', 'Q3', 'Q4']
            }
        };
    }

    ngOnInit(): void {
        // Load the default chart
        const defaultData = this.chartData[this.selectedTimeframe];
        this.mpOverviewService.loadChart(defaultData.series, defaultData.categories);
    }

    onTimeframeChange(timeframe: string): void {
        this.selectedTimeframe = timeframe; // Update button text
        const selectedData = this.chartData[timeframe];
        this.mpOverviewService.updateChart(selectedData.series, selectedData.categories);
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