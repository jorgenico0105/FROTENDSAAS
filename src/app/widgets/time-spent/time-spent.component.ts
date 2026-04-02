import { Component, HostListener } from '@angular/core';
import { TimeSpentService } from './time-spent.service';

@Component({
    selector: 'app-time-spent:not(1)',
    imports: [],
    templateUrl: './time-spent.component.html',
    styleUrl: './time-spent.component.scss'
})
export class TimeSpentComponent {

    selectedTimeframe: string = 'This Week';
    chartData: { [key: string]: { series: { name: string; data: number[] }[]; categories: string[] } };

    constructor(
        private timeSpentService: TimeSpentService
    ) {
        this.chartData = {
            'This Day': {
                series: [{ name: 'Time Spent', data: [5, 10, 15, 20, 25] }],
                categories: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM']
            },
            'This Week': {
                series: [{ name: 'Time Spent', data: [30, 70, 80, 95, 90, 20, 40] }],
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            'This Month': {
                series: [{ name: 'Time Spent', data: [100, 120, 90, 110] }],
                categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
            },
            'This Year': {
                series: [{ name: 'Time Spent', data: [300, 400, 350, 450] }],
                categories: ['Q1', 'Q2', 'Q3', 'Q4']
            }
        };
    }

    ngOnInit(): void {
        const defaultData = this.chartData[this.selectedTimeframe];
        this.timeSpentService.loadChart(defaultData.series, defaultData.categories);
    }

    onTimeframeChange(timeframe: string): void {
        this.selectedTimeframe = timeframe;
        const selectedData = this.chartData[timeframe];
        this.timeSpentService.updateChart(selectedData.series, selectedData.categories);
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