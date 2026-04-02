import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CutValueComponent } from './cut-value/cut-value.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-clipboard',
    imports: [RouterLink, NgClass, FormsModule, CutValueComponent],
    templateUrl: './clipboard.component.html',
    styleUrl: './clipboard.component.scss'
})
export class ClipboardComponent {

    copyText: string = '#annual90conference2025'; // Bind this to your input
    copied: boolean = false; // Tracks if the text is copied
    buttonText: string = 'Copy'; // Button text
    copyToClipboard(input: HTMLInputElement): void {
        if (!input) return;
        // Select and copy the input field value
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard
        .writeText(input.value)
        .then(() => {
            this.copied = true; // Change icon
            this.buttonText = ''; // Remove text temporarily
            setTimeout(() => {
                this.copied = false; // Revert icon
                this.buttonText = 'Copy'; // Restore text
            }, 2000);
        })
        .catch((err) => {
            console.error('Error copying text: ', err);
        });
    }

}