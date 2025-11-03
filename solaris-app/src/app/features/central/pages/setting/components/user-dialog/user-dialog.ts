import { Component } from '@angular/core';

interface User {
  id: number;
  username: string;
  password: string;
  role: 'administrator' | 'user';
  pageAccess: string[];
}

@Component({
  selector: 'app-user-dialog',
  standalone: false,
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss'
})
export class UserDialog {
  // User Management
  users: User[] = [];
  showUserModal: boolean = false;
  editingUser: User | null = null;
  newUser: User = this.getEmptyUser();
  availablePages: string[] = [
    'Central Overview',
    'Central Performance',
    'Trends',
    'Overview',
    'Dashboard',
    'Performance',
    'Realtime',
    'Diagram',
    'Charts',
    'Events',
    'Reports',
    'Billings',
    'Settings',
    'Billing Admin'
  ];

  private nextUserId: number = 1;

  constructor(){}

  ngOnInit(): void {
    this.initializeMockData();
  }

  initializeMockData(): void {
    // Mock users
    this.users = [
      {
        id: this.nextUserId++,
        username: 'admin',
        password: 'admin123',
        role: 'administrator',
        pageAccess: ['Dashboard', 'Energy Monitoring', 'Reports', 'Settings', 'Alarm Management', 'User Management', 'Holiday Setting', 'Billing']
      },
      {
        id: this.nextUserId++,
        username: 'demouser',
        password: '1234',
        role: 'administrator',
        pageAccess: ['Dashboard', 'Energy Monitoring', 'Reports', 'Settings', 'Alarm Management', 'User Management', 'Holiday Setting', 'Billing']
      },
      {
        id: this.nextUserId++,
        username: 'operator1',
        password: 'op123',
        role: 'user',
        pageAccess: ['Dashboard', 'Energy Monitoring', 'Reports']
      },
      {
        id: this.nextUserId++,
        username: 'viewer',
        password: 'view123',
        role: 'user',
        pageAccess: ['Dashboard', 'Reports']
      }
    ];
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

  openAddUserModal(): void {
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
    this.showUserModal = true;
  }

  openEditUserModal(user: User): void {
    this.editingUser = user;
    this.newUser = { ...user, pageAccess: [...user.pageAccess] };
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.editingUser = null;
    this.newUser = this.getEmptyUser();
  }

  togglePageAccess(page: string): void {
    const index = this.newUser.pageAccess.indexOf(page);
    if (index > -1) {
      this.newUser.pageAccess.splice(index, 1);
    } else {
      this.newUser.pageAccess.push(page);
    }
  }

  hasPageAccess(page: string): boolean {
    return this.newUser.pageAccess.includes(page);
  }

  selectAllPages(): void {
    this.newUser.pageAccess = [...this.availablePages];
  }

  deselectAllPages(): void {
    this.newUser.pageAccess = [];
  }

  saveUser(): void {
    if (!this.newUser.username.trim()) {
      alert('Please enter username');
      return;
    }

    if (!this.newUser.password.trim()) {
      alert('Please enter password');
      return;
    }

    if (this.editingUser) {
      // Update existing user
      const index = this.users.findIndex(u => u.id === this.editingUser!.id);
      if (index > -1) {
        this.users[index] = { ...this.newUser, id: this.editingUser.id };
      }
      alert('User updated successfully!');
    } else {
      // Add new user
      this.newUser.id = this.nextUserId++;
      this.users.push({ ...this.newUser });
      alert('User added successfully!');
    }

    this.closeUserModal();
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(u => u.id !== id);
      alert('User deleted successfully!');
    }
  }

  saveUserChanges(): void {
    console.log('Saving all user changes:', this.users);
    alert('User changes saved successfully!');
  }
}
