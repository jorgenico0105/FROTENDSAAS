import { Component } from '@angular/core';
import { TotalRevenueService } from './total-revenue.service';

@Component({
    selector: 'app-total-revenue:not(1)',
    imports: [],
    templateUrl: './total-revenue.component.html',
    styleUrl: './total-revenue.component.scss'
})
export class TotalRevenueComponent {

    constructor(
        private totalRevenueService: TotalRevenueService
    ) {}

    ngOnInit(): void {
        this.totalRevenueService.loadChart();
    }

}