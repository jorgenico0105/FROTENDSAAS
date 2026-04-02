import { Component } from '@angular/core';
import { TotalOrdersService } from './total-orders.service';

@Component({
    selector: 'app-total-orders:not(1)',
    imports: [],
    templateUrl: './total-orders.component.html',
    styleUrl: './total-orders.component.scss'
})
export class TotalOrdersComponent {

    constructor(
        private totalOrdersService: TotalOrdersService
    ) {}

    ngOnInit(): void {
        this.totalOrdersService.loadChart();
    }

}