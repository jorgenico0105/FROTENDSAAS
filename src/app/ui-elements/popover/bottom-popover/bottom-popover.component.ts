import { Component, HostListener } from '@angular/core';

@Component({
    selector: 'app-bottom-popover',
    imports: [],
    templateUrl: './bottom-popover.component.html',
    styleUrl: './bottom-popover.component.scss'
})
export class BottomPopoverComponent {

    popoverVisible = false;  // Controls visibility of the popover
    popoverText: string = ''; // Text content for the popover

    // Toggles the visibility of the popover
    togglePopover(event: MouseEvent, text: string): void {
        // Prevent the event from propagating to the document click listener
        event.stopPropagation();
        this.popoverText = text;  // Set the popover text from the data attribute
        this.popoverVisible = !this.popoverVisible;  // Toggle the visibility
    }

    // Close the popover when clicking outside
    @HostListener('document:click', ['$event'])
    closePopover(event: MouseEvent): void {
        const button = document.querySelector('.custom-popover') as HTMLElement;
        if (!button.contains(event.target as Node)) {
            this.popoverVisible = false; // Hide the popover if clicked outside
        }
    }

}