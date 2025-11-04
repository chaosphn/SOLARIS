import { Component, input, OnInit, output } from '@angular/core';
import { User } from '../../../../models/billing.model';

@Component({
  selector: 'app-user-dialog',
  standalone: false,
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss'
})
export class UserDialog implements OnInit {
  
  userData = input<User>(this.getEmptyUser());
  pageList = input<string[]>([]);
  onClose = output();

  private nextUserId: number = 1;

  constructor(){}

  ngOnInit(): void {
    this.initializeMockData();
  }

  initializeMockData(): void {
    
  }

  // User Management Methods
  getEmptyUser(): User {
    return {
      id: 0,
      username: '',
      password: '',
      role: 'user',
      pageAccess: []
    };
  }

  closeUserModal(): void {
    this.onClose.emit();
  }

  togglePageAccess(page: string): void {
    const index = this.userData().pageAccess.indexOf(page);
    if (index > -1) {
      this.userData().pageAccess.splice(index, 1);
    } else {
      this.userData().pageAccess.push(page);
    }
  }

  hasPageAccess(page: string): boolean {
    return this.userData().pageAccess.includes(page);
  }

  selectAllPages(): void {
    this.userData().pageAccess = [...this.pageList()];
  }

  deselectAllPages(): void {
    this.userData().pageAccess = [];
  }

  saveUser(): void {
    if (!this.userData().username.trim()) {
      alert('Please enter username');
      return;
    }

    if (!this.userData().password.trim()) {
      alert('Please enter password');
      return;
    }

    this.closeUserModal();
  }
}
