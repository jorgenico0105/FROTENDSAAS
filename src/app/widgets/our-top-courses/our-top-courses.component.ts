import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';

@Component({
    selector: 'app-our-top-courses:not(1)',
    imports: [RouterLink, CarouselModule],
    templateUrl: './our-top-courses.component.html',
    styleUrl: './our-top-courses.component.scss'
})
export class OurTopCoursesComponent {

	// Owl Carousel
    ourTopCoursesSlides: OwlOptions = {
        items: 1,
		nav: false,
		loop: true,
		margin: 25,
		dots: true,
		autoplay: true,
		smartSpeed: 500,
        animateIn: 'fadeIn',
		animateOut: 'fadeOut',
		autoplayHoverPause: true,
		navText: [
			"<i class='ri-arrow-left-line'></i>",
			"<i class='ri-arrow-right-line'></i>"
		]
    }

}