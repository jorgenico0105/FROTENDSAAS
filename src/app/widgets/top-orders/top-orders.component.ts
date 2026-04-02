import { Component } from '@angular/core';
import { TopOrdersService } from './top-orders.service';

@Component({
    selector: 'app-top-orders',
    imports: [],
    templateUrl: './top-orders.component.html',
    styleUrl: './top-orders.component.scss'
})
export class TopOrdersComponent {

    constructor(
        private topOrdersService: TopOrdersService
    ) {}

    ngOnInit(): void {
        this.topOrdersService.loadChart();
    }

}