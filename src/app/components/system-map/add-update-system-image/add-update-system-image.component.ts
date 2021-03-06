import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { Base64Upload } from 'src/app/models/misc.model';
import { SystemImage } from 'src/app/models/system-map.model';
import { SystemMapService } from 'src/app/services/system-map.service';

@Component({
  selector: 'app-add-update-system-image',
  templateUrl: './add-update-system-image.component.html',
  styleUrls: ['./add-update-system-image.component.scss'],
})
export class AddUpdateSystemImageComponent implements OnInit {
  systemImage: SystemImage;
  ofStarObjectId: string;
  formAction: string;
  dataSubmitted: boolean;

  // loading indicator
  loadingIndicator: HTMLIonLoadingElement;

  constructor(
    private systemMapService: SystemMapService,
    private modalController: ModalController,
    private loading: LoadingController
  ) { }

  async submitForm() {
    this.dataSubmitted = true;

    this.loadingIndicator = await this.loading.create({
      message: `${this.formAction.slice(0, -1)}ing`
    });
    await this.loadingIndicator.present();

    if (this.systemImage.id) {
      this.systemMapService.updateSystemImage(this.systemImage).subscribe((results) => {

        // remove the loading locating indicator
        if (this.loadingIndicator) {
          this.loading.dismiss();
        }

        if (!(results instanceof HttpErrorResponse)) {
          this.systemMapService.refreshData();
          this.dismiss();
        } else {
          this.dataSubmitted = false;
        }
      });
    } else {
      this.systemMapService.addSystemImage(this.systemImage).subscribe((results) => {

        // remove the loading locating indicator
        if (this.loadingIndicator) {
          this.loading.dismiss();
        }

        if (!(results instanceof HttpErrorResponse)) {
          this.systemMapService.refreshData();
          this.dismiss();
        } else {
          this.dataSubmitted = false;
        }
      });
    }
  }

  setPrimaryImage(event: Base64Upload) {
    this.systemImage.new_image = event;
  }

  valid(): boolean {
    if (this.systemImage
      && this.systemImage.title
      && this.systemImage.of_star_object_id
      && (this.systemImage.image_url || this.systemImage.new_image)) {
      return true;
    } else {
      return false;
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  ngOnInit() {
    if (this.systemImage && this.systemImage.id) {
      this.systemImage.of_star_object_id = this.ofStarObjectId;
      this.formAction = 'Update';
    } else {
      this.systemImage = { of_star_object_id: this.ofStarObjectId } as SystemImage;
      this.formAction = 'Create';
    }
  }

}
