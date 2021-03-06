import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { LoadingController, ModalController, Platform } from '@ionic/angular';
import { Subscription, concat, from } from 'rxjs';
import { concatAll } from 'rxjs/operators';
import { AuthService } from 'src/app/auth.service';
import { StarObject, SystemImage } from 'src/app/models/system-map.model';
import { SystemMapService } from 'src/app/services/system-map.service';
import { Plugins } from '@capacitor/core';
import { AddUpdateStarObjectComponent } from 'src/app/components/system-map/add-update-star-object/add-update-star-object.component';
import { FieldService } from 'src/app/services/field.service';
import { SystemMapTypeField } from 'constants';
import { Field, FieldDescriptor } from 'src/app/models/field.model';
import { AppConfig, SettingsService } from 'src/app/services/settings.service';
import { AddUpdateSystemImageComponent } from 'src/app/components/system-map/add-update-system-image/add-update-system-image.component';
import { ViewSystemImageComponent } from 'src/app/components/system-map/view-system-image/view-system-image.component';

const { Toast, Modals, Share } = Plugins;

@Component({
  selector: 'app-system-map-details',
  templateUrl: './system-map-details.page.html',
  styleUrls: ['./system-map-details.page.scss'],
})
export class SystemMapDetailsPage implements OnInit, OnDestroy {
  slideOpts = {
    slidesPerView: 0
  };

  isEditor: boolean;

  fullList: StarObject[] = [];
  selectedItemId: string;
  selectedItem: StarObject;

  // subscriptions
  routeSubscription: Subscription;
  updateSubscription: Subscription;
  resizeSubscription: Subscription;

  // loading indicator
  loadingIndicator: HTMLIonLoadingElement;

  // config
  config: AppConfig;

  readonly routePartialObjectId: string;
  initialDataLoaded: boolean;
  starObjectTypes: FieldDescriptor[] = [];
  isCap: boolean;

  constructor(
    private systemMapService: SystemMapService,
    private authService: AuthService,
    private loading: LoadingController,
    private router: Router,
    private route: ActivatedRoute,
    private modalController: ModalController,
    private fieldService: FieldService,
    private settingsService: SettingsService,
    private platform: Platform
  ) {
    this.routePartialObjectId = this.route.snapshot.paramMap.get('id').split('-')[0];

    if (this.router.getCurrentNavigation()?.extras.state) {
      this.selectedItem = this.router.getCurrentNavigation().extras.state.smObject;
      console.log(this.selectedItem);
    }

    this.updateSubscription = this.systemMapService.dataRefreshAnnounced$.subscribe(() => {
      this.fetchSystemObjectsAndSelect();
    });

    this.resizeSubscription = this.platform.resize.subscribe(() => {
      this.determineSlideCount();
    });
  }

  doRefresh(event: any) {
    this.fetchSystemObjectsAndSelect(event);
  }

  isReadOnly(field: Field): string {
    if (field.read_only) {
      return 'dark';
    } else {
      return '';
    }
  }

  fetchSystemObjectsAndSelect(event?: any) {
    this.fieldService.getField(SystemMapTypeField).subscribe((results) => {
      if (!(results instanceof HttpErrorResponse)) {
        this.starObjectTypes = results;
      }
    });

    this.systemMapService.searchByUUID(this.routePartialObjectId).subscribe((results) => {
      if (!(results instanceof HttpErrorResponse)) {
        if (results.length === 1) { // we found found it
          this.selectedItem = results[0];

          if (this.selectedItem.fields) {
            this.selectedItem.fields = this.selectedItem.fields.filter(x => {
              if (!(x.hide_no_value && !this.findFieldValue(x.id))) {
                return x;
              }
            });
          }

          this.initialDataLoaded = true;
          console.log(this.selectedItem);

        } else if (results.length === 0) { // we didn't find it
          Toast.show({
            text: 'System Map object not found!'
          });
          this.router.navigateByUrl('/system-map');
        } else {
          Toast.show({
            text: 'Multiple objects found for selected partial ID. Please contact an app administrator.'
          });
          this.router.navigateByUrl('/system-map');
        }

        // stop the spinner
        if (this.loadingIndicator) {
          this.loading.dismiss();
        }

        if (event) {
          event.target.complete();
        }
      }
    });
  }

  private determineSlideCount() {
    const platWidth = this.platform.width();
    // console.log(platWidth);
    const big = 4;
    const small = 2;

    if (platWidth < 600) { // this.platform.is('mobile') ||
      this.slideOpts.slidesPerView = small;
      // if (this.slidesSearch) {
      //   this.slidesSearch.options.slidesPerView = small;
      // }
      // this.slidesPeople.options.slidesPerView = small;
      // this.slidesLocations.options.slidesPerView = small;
      // this.slidesSystems.options.slidesPerView = small;
    } else {
      this.slideOpts.slidesPerView = big;
      // if (this.slidesSearch) {
      //   this.slidesSearch.options.slidesPerView = big;
      // }
      // this.slidesPeople.options.slidesPerView = big;
      // this.slidesLocations.options.slidesPerView = big;
      // this.slidesSystems.options.slidesPerView = big;
    }
  }

  selectChildren(typeId: string): StarObject[] {
    if (this.selectedItem
      && this.selectedItem.children
      && this.selectedItem.children.length > 0) {
      return this.selectedItem.children.filter(x => x.object_type_id === typeId);
    }
  }

  selectListItem(listItem: StarObject) {
    const navigationExtras: NavigationExtras = {
      relativeTo: this.route.parent,
      // state: {
      //   smObject: listItem
      // }
    };
    const uri = `/system-map/${listItem.id.split('-')[0]}-${listItem.title.toLowerCase().split(' ').join('-').replace(/[^-A-Za-z0-9_]+/g, '')}`;
    console.log(uri);

    this.router.navigateByUrl(uri);
    // this.router.navigate([`${listItem.id.split('-')[0]}-${listItem.title.toLowerCase().split(' ').join('-')}`], navigationExtras);
  }

  parseObjectLink(item: StarObject): string {
    const urlObjectId = `${item.id.split('-')[0]}-${item.title.trim().toLowerCase().split(' ').join('-')}`;
    return urlObjectId;
  }

  async fetchObjectDetails() {
    // clear the current item if it exists
    if (this.selectedItem) {
      this.selectedItem = null;
    }

    // spin the spinner
    // setup the loading indicator
    this.loadingIndicator = await this.loading.create({
      message: 'Loading'
    });
    await this.loadingIndicator.present();

    while (!this.loadingIndicator) {
      // this might be a terrible idea...
      // but it should create a temp ms long hold to prevent the app from the skipping past the indicator being loaded
    }

    this.fetchSystemObjectsAndSelect();

  }

  async updateStarObject() {
    const modal = await this.modalController.create({
      component: AddUpdateStarObjectComponent,
      componentProps: {
        starObject: this.selectedItem
      }
    });
    return await modal.present();
  }

  async archiveStarObject() {
    if (this.selectedItem && this.selectedItem.id) {
      const confirmRet = await Modals.confirm({
        title: 'Confirm',
        message: 'Are you sure you want to archive this system map object?'
      });

      if (confirmRet.value) {
        this.systemMapService.archiveStarObject(this.selectedItem).subscribe((results) => {
          if (!(results instanceof HttpErrorResponse)) {
            this.router.navigateByUrl('/system-map');
          }
        });
      }
    }
  }

  async addStarObject() {
    const modal = await this.modalController.create({
      component: AddUpdateStarObjectComponent,
      componentProps: {
        preferredParent: this.selectedItem
      }
    });
    return await modal.present();
  }

  async addUpdateSystemMapImage(systemImage?: SystemImage) {
    const modal = await this.modalController.create({
      component: AddUpdateSystemImageComponent,
      componentProps: {
        systemImage,
        ofStarObjectId: this.selectedItem.id
      }
    });

    return await modal.present();
  }

  async viewSystemImage(image: SystemImage) {
    const modal = await this.modalController.create({
      component: ViewSystemImageComponent,
      componentProps: {
        image
      },
      cssClass: 'big-viewer'
    });

    return await modal.present();
  }

  async getSettings() {
    this.config = await this.settingsService.getConfig();
  }

  findFieldValue(fieldId: string) {
    if (fieldId && this.selectedItem && this.selectedItem.field_values) {
      return this.selectedItem.field_values.find(x => x.field_id === fieldId)?.value;
    } else {
      console.warn('erm field id not passed to findFieldValue');
    }
  }

  async shareItem() {
    const uri = `system-map/${this.selectedItem.id.split('-')[0]}-${this.selectedItem.title.toLowerCase().split(' ').join('-').replace(/[^-A-Za-z0-9_]+/g, '')}`;
    const shareString = `The ${this.selectedItem.title} on BendroCorp`;

    const shareRet = await Share.share({
      title: shareString,
      text: shareString,
      url: `https://bendrocorp.app/${uri}`,
    });
  }

  async ngOnInit() {
    this.isCap = this.platform.is('capacitor');

    this.isEditor = (await this.authService.hasClaim(22) || await this.authService.hasClaim(23)) ? true : false;
    await this.getSettings();

    this.determineSlideCount();

    if (!this.selectedItem) {
      await this.fetchObjectDetails();
    }
  }

  ngOnDestroy() {
    //
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }

    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }

    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

}
