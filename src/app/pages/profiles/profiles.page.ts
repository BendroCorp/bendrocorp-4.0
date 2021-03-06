import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NavController, ModalController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Division, Character } from 'src/app/models/character.model';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.page.html',
  styleUrls: ['./profiles.page.scss'],
})
export class ProfilesPage implements OnInit, OnDestroy {

  divisions: Division[] = [];
  profileSubscription: Subscription;

  // loading indicator
  loadingIndicator: HTMLIonLoadingElement;

  constructor(
    private profileService: ProfileService,
    private navController: NavController,
    private modalController: ModalController,
    private loading: LoadingController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.profileSubscription = this.profileService.dataRefreshAnnounced$.subscribe(() => {
      this.fetchProfilesByDivision();
    });
  }

  fetchProfilesByDivision() {
    this.profileService.list_by_division().subscribe((results) => {
      if (!(results instanceof HttpErrorResponse)) {
        this.divisions = results;
      }

      if (this.loadingIndicator) {
        this.loadingIndicator.dismiss();
      }
    });
  }

  sortDivision(division: Division) {
    return division.division_members.sort((a, b) => {
      return a.current_job_level - b.current_job_level;
    });
  }

  openProfileDetails(member: Character) {
    const navigationExtras: NavigationExtras = {
      relativeTo: this.route,
      state: {
        character: member
      }
    };

    this.router.navigate([member.id], navigationExtras);
  }

  ionViewWillEnter() {
    // this.fetchProfilesByDivision();
  }

  async ngOnInit() {
    this.loadingIndicator = await this.loading.create({
      message: 'Loading'
    });
    await this.loadingIndicator.present();
    this.fetchProfilesByDivision();
  }

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

}
