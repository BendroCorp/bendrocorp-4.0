import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';
import { MyApproval } from 'src/app/models/approval.model';
import { RequestsService } from 'src/app/services/requests.service';
import { UserService } from 'src/app/services/user.service';
import { Plugins } from '@capacitor/core';
import { AuthService } from 'src/app/auth.service';

const { Modals } = Plugins;

@Component({
  selector: 'app-approval-details',
  templateUrl: './approval-details.page.html',
  styleUrls: ['./approval-details.page.scss'],
})
export class ApprovalDetailsPage implements OnInit {

  approverId: number = parseInt(this.route.snapshot.paramMap.get('approvalId'), null);
  approval: MyApproval;
  approvalSubmitting: boolean;
  loadingIndicator: any;
  isCeo: boolean;

  hideThis = true; // just used to hide things

  constructor(
    private requestService: RequestsService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private nav: NavController,
    private loading: LoadingController,
    private authService: AuthService
    // private iab: InAppBrowser
    ) {
    if (this.router.getCurrentNavigation()?.extras.state?.approval) {
      this.approval = this.router.getCurrentNavigation().extras.state.approval;
    }
  }

  async fetchApprovalDetails(event?: any) {
    if (this.approverId) {
      this.requestService.fetch_approval(this.approverId).subscribe((results) => {
        if (!(results instanceof HttpErrorResponse)) {
          this.approval = results;
        } else {
          this.nav.back();
          // this.router.
        }

        if (this.loadingIndicator) {
          this.loadingIndicator.dismiss();
        }

        if (event) {
          event.target.complete();
        }
      });
    } else {
      await Modals.alert({
        title: 'Error',
        message: 'Approver id not correctly passed!'
      });
      this.nav.back();
    }
  }

  openLinkedItem(uri: string) {
    // const options: InAppBrowserOptions = {
    //   location: 'no'
    // };
    // const browser = this.iab.create(`https://my.bendrocorp.com/${uri}`, '_system', options);
  }

  async removeApprover(approver_id: number) {
    if (approver_id) {
      const confirmRet = await Modals.confirm({
        title: 'Confirm',
        message: 'Are you sure you want remove this approver? This will set their status to not needed and override any previous approval type. (CEO ONLY)'
      });

      if (confirmRet.value) {
        this.requestService.remove_approver(approver_id).subscribe((results) => {
          if (!(results instanceof HttpErrorResponse)) {
            this.fetchApprovalDetails();
          }
        });
      }
    }
  }

  async submitApproval(typeId: number) {
    if (this.approval) {
      let appDen = '...';
      if (typeId === 4) {
        appDen = 'approve';
      }

      if (typeId === 5) {
        appDen = 'deny';
      }

      const confirmRet = await Modals.confirm({
        title: 'Confirm',
        message: `Are you sure you want to ${appDen} approval #${this.approval.approval_id}?`
      });

      if (confirmRet.value) {
        this.approvalSubmitting = true;
        this.requestService.submit_approval(this.approval.approval_id, typeId).subscribe(
          (results) => {
            if (!(results instanceof HttpErrorResponse)) {
              this.fetchApprovalDetails();
              this.userService.refreshData();
            } else {
              Modals.alert({
                title: 'Error',
                message: 'Approval could not be processed!'
              });
            }
            this.approvalSubmitting = false;
          }
        );
      }
    }
  }

  doRefresh(event: any) {
    this.fetchApprovalDetails(event);
  }

  async ngOnInit() {
    this.isCeo = await this.authService.hasClaim(9);

    if (!this.approval) {
      this.loadingIndicator = await this.loading.create({
        message: 'Loading'
      });
      await this.loadingIndicator.present();

      this.fetchApprovalDetails();
    }
  }

}
