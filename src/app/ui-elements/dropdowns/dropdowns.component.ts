import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-dropdowns',
    imports: [RouterLink],
    templateUrl: './dropdowns.component.html',
    styleUrl: './dropdowns.component.scss'
})
export class DropdownsComponent {

    // Dropdown
    isCardHeaderOpen = false;
    isCardHeaderOpen2 = false;
    isCardHeaderOpen3 = false;
    isCardHeaderOpen4 = false;
    toggleCardHeaderMenu() {
        this.isCardHeaderOpen = !this.isCardHeaderOpen;
    }
    toggleCardHeaderMenu2() {
        this.isCardHeaderOpen2 = !this.isCardHeaderOpen2;
    }
    toggleCardHeaderMenu3() {
        this.isCardHeaderOpen3 = !this.isCardHeaderOpen3;
    }
    toggleCardHeaderMenu4() {
        this.isCardHeaderOpen4 = !this.isCardHeaderOpen4;
    }
    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.trezo-card-dropdown')) {
            this.isCardHeaderOpen = false;
        }
        if (!target.closest('.trezo-card-dropdown2')) {
            this.isCardHeaderOpen2 = false;
        }
        if (!target.closest('.trezo-card-dropdown3')) {
            this.isCardHeaderOpen3 = false;
        }
        if (!target.closest('.trezo-card-dropdown4')) {
            this.isCardHeaderOpen4 = false;
        }
    }

}