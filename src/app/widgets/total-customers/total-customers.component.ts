import { Component } from '@angular/core';
import { TotalCustomersService } from './total-customers.service';

@Component({
    selector: 'app-total-customers:not(1)',
    imports: [],
    templateUrl: './total-customers.component.html',
    styleUrl: './total-customers.component.scss'
})
export class TotalCustomersComponent {

    constructor(
        private totalCustomersService: TotalCustomersService
    ) {}

    ngOnInit(): void {
        this.totalCustomersService.loadChart();
    }

}