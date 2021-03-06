import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { TimeSpan } from 'ng-timespan';
import { interval, Observable, Subscription } from 'rxjs';
import { NewsDetailComponent } from 'src/app/components/news-detail/news-detail.component';
import { Event } from 'src/app/models/event.model';
import { ILNewsStory } from 'src/app/models/news.model';
import { UserSessionResponse } from 'src/app/models/user.model';
import { EventService } from 'src/app/services/event.service';
// import { loading } from 'src/app/services/loading-service.service';
import { NewsService } from 'src/app/services/news.service';
import { EventDetailsPage } from '../events/event-details/event-details.page';

import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  loadingIndicator: HTMLIonLoadingElement;
  nextEvent: Event;
  news: ILNewsStory[] = [];
  events: Event[];
  eventStartedSubscription: Subscription;
  eventsFetched: boolean = false;
  newsFetched: boolean = false;
  showCountdown: boolean;
  showStartCountdown: boolean;
  showEndCountdown: boolean;
  checkerStarted: boolean;
  initialDataLoaded: boolean = false;

  dataLoadedSubscription: Subscription;
  dataInterval: Observable<number> = interval(500);

  constructor(
    private eventService: EventService,
    private newsService: NewsService,
    private loading: LoadingController,
    private modalController: ModalController
  ) {

    this.dataLoadedSubscription = this.dataInterval.subscribe(() => {
      if (this.newsFetched && this.eventsFetched) {
        try {
          this.loadingIndicator.dismiss();
          this.dataLoadedSubscription.unsubscribe();
          this.initialDataLoaded = true;
        } catch (error) {
          // do nada
        }

        // stop the subscriber
        this.dataLoadedSubscription.unsubscribe();
      }
    });
  }

  async ngOnInit() {
    this.loadingIndicator = await this.loading.create({
      message: 'Loading'
    });
    await this.loadingIndicator.present();

    this.fetchEvents();
    this.fetchNews();

    // may not keep.....
    // VANTA.NET({
    //   el: 'ion-router-outlet',
    //   mouseControls: false,
    //   touchControls: false,
    //   gyroControls: false,
    //   minHeight: 200.00,
    //   minWidth: 200.00,
    //   scale: 1.00,
    //   scaleMobile: 1.00,
    //   color: 0x17b2ff,
    //   backgroundAlpha: 0,
    //   points: 6.00,
    //   maxDistance: 25.00,
    //   showDots: false
    // });
  }

  ngOnDestroy() {
    if (this.eventStartedSubscription) {
      this.eventStartedSubscription.unsubscribe();
    }
  }

  async openNewsModal(newsItem: ILNewsStory) {
    const modal = await this.modalController.create({
      component: NewsDetailComponent,
      componentProps: {
        newsItem
      }
    });
    return await modal.present();
  }

  async openEventModal(event: Event) {
    const modal = await this.modalController.create({
      component: EventDetailsPage,
      componentProps: {
        event,
        openedAsModal: true
      }
    });
    return await modal.present();
  }

  async openDiscord() {
    // Open our private Discord link
    // https://discord.com/channels/123161736181317632/123161736181317632
    // const browser = this.iab.create('https://discord.gg/daeYKRS', '_system');
    await Browser.open({
      url: 'https://discord.com/channels/123161736181317632/123161736181317632',
      windowName: '_blank'
    });
  }

  fetchNews(event?: any) {
    this.newsFetched = false;
    this.newsService.list().subscribe((results) => {
      if (!(results instanceof HttpErrorResponse)) {
        this.news = results.filter(x => x.published).slice(0, 3);
        this.newsFetched = true;

        // if (event) {
        //   if (this.newsFetched && this.eventsFetched) {
        //     event.target.complete();
        //   }
        // }

        // if (this.newsFetched && this.eventsFetched) {
        //   if (!this.initialDataLoaded) {
        //     this.initialDataLoaded = true;
        //   }
        //   console.log(`n n ${this.newsFetched} e ${this.eventsFetched}`);
        //   this.loading.dismiss();
        // } else {
        //   console.log(`n n ${this.newsFetched} e ${this.eventsFetched}`);
        // }
      }
    });
  }

  fetchEvents(event?: any) {
    this.eventsFetched = false;
    this.showStartCountdown = false;
    this.showEndCountdown = false;

    // if this sub exists get rid of it since this method will rebuild it
    if (this.eventStartedSubscription) {
      this.eventStartedSubscription.unsubscribe();
    }

    this.eventService.list().subscribe(
      (results) => {
        if (!(results instanceof HttpErrorResponse)) {
          console.log(results);
          if (results.length > 0) {
            // get the first event
            this.nextEvent = results.slice(0, 1)[0];
            this.events = results.splice(0, 1);

            // set fetched to true?
            this.eventsFetched = true;

            // if (event) {
            //   if (this.newsFetched && this.eventsFetched) {
            //     if (!this.initialDataLoaded) {
            //       this.initialDataLoaded = true;
            //     }
            //     // console.log(`n n ${this.newsFetched} e ${this.eventsFetched}`);
            //     // this.loading.dismiss();
            //     event.target.complete();
            //   }
            // }

            // if (this.newsFetched && this.eventsFetched) {
            //   if (!this.initialDataLoaded) {
            //     this.initialDataLoaded = true;
            //   }
            //   console.log(`n n ${this.newsFetched} e ${this.eventsFetched}`);
            //   this.loading.dismiss();
            // } else {
            //   console.log(`e n ${this.newsFetched} e ${this.eventsFetched}`);
            // }

            // if we found a next event do the work to monitor it
            if (this.nextEvent) {
              this.eventStartedSubscription = interval(500).subscribe(
                () => {
                  // if the start date is less than now
                  const eventStart = new Date(this.nextEvent.start_date);
                  const eventEnd = new Date(this.nextEvent.end_date);

                  const currentToStart = TimeSpan.Subtract(new Date(), eventStart); // new Date().getTime();
                  const currentToEnd = TimeSpan.Subtract(new Date(), eventEnd);

                  // console.log(`Dashboard Event:: STTC: ${currentToStart.totalSeconds}, ETTC: ${currentToEnd.totalSeconds}`);

                  if (currentToStart.totalSeconds > 0 && currentToEnd.totalSeconds > 0) { // event is still upcoming
                    // console.log('Dashboard: Event upcoming!');
                    this.showStartCountdown = true;
                    this.showEndCountdown = false;

                  } else if (currentToStart.totalSeconds <= 0 && currentToEnd.totalSeconds > 0) { // event is happening now
                    // console.log('Dashboard: Event happening now!');
                    this.showStartCountdown = false;
                    this.showEndCountdown = true;
                    // this.eventStartedSubscription.unsubscribe();
                  } else if (currentToStart.totalSeconds <= 0
                    && currentToEnd.totalSeconds <= 0) { // event has ended and we need to see if there is a new event
                    // console.log('Dashboard: Event expired!');
                    this.showStartCountdown = false;
                    this.showEndCountdown = false;
                    this.nextEvent = null;
                    this.fetchEvents();
                  }
                  this.checkerStarted = true;
                }
              );
            }
          } else {
            this.eventsFetched = true;

            // if (event) {
            //   if (this.newsFetched && this.eventsFetched) {
            //     if (!this.initialDataLoaded) {
            //       this.initialDataLoaded = true;
            //     }
            //     this.loading.dismiss();
            //     event.target.complete();
            //   }
            // }

            // if (this.newsFetched && this.eventsFetched) {
            //   if (!this.initialDataLoaded) {
            //     this.initialDataLoaded = true;
            //   }
            //   this.loading.dismiss();
            // } else {
            //   console.log(`en n ${this.newsFetched} e ${this.eventsFetched}`);
            // }
          }
        }
      }
    );
  }

  ionViewWillEnter() {
    this.showCountdown = true;
    if (!this.nextEvent) {
      this.fetchEvents();
    }
  }

  ionViewDidLeave() {
    this.showCountdown = false;
  }
}
