import { Component } from '@angular/core';
import { TicketsDueService } from './tickets-due.service';

@Component({
    selector: 'app-tickets-due:not(1)',
    imports: [],
    templateUrl: './tickets-due.component.html',
    styleUrl: './tickets-due.component.scss'
})
export class TicketsDueComponent {

    constructor(
        private ticketsDueService: TicketsDueService
    ) {}

    ngOnInit(): void {
        this.ticketsDueService.loadChart();
    }

}