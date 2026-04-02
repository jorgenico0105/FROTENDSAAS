/**
 * Menu Item Model - Used for dynamic sidebar navigation
 */
export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  route?: string;
  externalUrl?: string;
  permission?: string;
  roles?: string[];
  children?: MenuItem[];
  badge?: MenuBadge;
  expanded?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  order?: number;
}

/**
 * Menu Badge - For notification counts or labels
 */
export interface MenuBadge {
  text: string | number;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

/**
 * Menu Section - Groups of menu items
 */
export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
  permission?: string;
  roles?: string[];
  order?: number;
}

/**
 * Complete Menu Configuration
 */
export interface MenuConfig {
  sections: MenuSection[];
  defaultExpanded?: string[];
}

/**
 * Menu State - For tracking expanded/collapsed states
 */
export interface MenuState {
  expandedItems: Set<string>;
  activeItem: string | null;
  activeSection: string | null;
}

/**
 * Static Menu Configuration
 * This will be used until backend menu endpoint is implemented
 */
export const STATIC_MENU_CONFIG: MenuSection[] = [
  {
    id: 'main',
    title: 'Main',
    order: 1,
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        // permission: 'dashboard.view',
        children: [
          { id: 'ecommerce', title: 'eCommerce', route: '/dashboard', permission: 'dashboard.ecommerce' },
          { id: 'crm', title: 'CRM', route: '/dashboard/crm', permission: 'dashboard.crm' },
          { id: 'project-management', title: 'Project Management', route: '/dashboard/project-management', permission: 'dashboard.project' },
          { id: 'lms', title: 'LMS', route: '/dashboard/lms', permission: 'dashboard.lms' },
          { id: 'helpdesk', title: 'HelpDesk', route: '/dashboard/helpdesk', permission: 'dashboard.helpdesk' },
          { id: 'analytics', title: 'Analytics', route: '/dashboard/analytics', permission: 'dashboard.analytics' },
          { id: 'crypto', title: 'Crypto', route: '/dashboard/crypto', permission: 'dashboard.crypto' },
          { id: 'sales', title: 'Sales', route: '/dashboard/sales', permission: 'dashboard.sales' },
          { id: 'hospital', title: 'Hospital', route: '/dashboard/hospital', permission: 'dashboard.hospital' },
          { id: 'hrm', title: 'HRM', route: '/dashboard/hrm', permission: 'dashboard.hrm' },
          { id: 'doctor', title: 'Doctor', route: '/dashboard/doctor', permission: 'dashboard.doctor' },
          { id: 'finance', title: 'Finance', route: '/dashboard/finance', permission: 'dashboard.finance' },
        ]
      },
      {
        id: 'apps',
        title: 'Apps',
        icon: 'apps',
        // permission: 'apps.view',
        children: [
          { id: 'to-do-list', title: 'To Do List', route: '/dashboard/apps', permission: 'apps.todo' },
          { id: 'calendar', title: 'Calendar', route: '/dashboard/apps/calendar', permission: 'apps.calendar' },
          { id: 'contacts', title: 'Contacts', route: '/dashboard/apps/contacts', permission: 'apps.contacts' },
          { id: 'chat', title: 'Chat', route: '/dashboard/apps/chat', permission: 'apps.chat' },
          { id: 'email', title: 'Email', route: '/dashboard/apps/email', permission: 'apps.email' },
          { id: 'kanban-board', title: 'Kanban Board', route: '/dashboard/apps/kanban-board', permission: 'apps.kanban' },
          { id: 'file-manager', title: 'File Manager', route: '/dashboard/apps/file-manager', permission: 'apps.files' },
        ]
      }
    ]
  },
  {
    id: 'pages',
    title: 'Pages',
    order: 2,
    items: [
      {
        id: 'ecommerce-page',
        title: 'eCommerce',
        icon: 'shopping_cart',
        // permission: 'pages.ecommerce',
        children: [
          { id: 'products', title: 'Products', route: '/dashboard/ecommerce-page', permission: 'ecommerce.products.view' },
          { id: 'orders', title: 'Orders', route: '/dashboard/ecommerce-page/orders', permission: 'ecommerce.orders.view' },
          { id: 'customers', title: 'Customers', route: '/dashboard/ecommerce-page/customers', permission: 'ecommerce.customers.view' },
          { id: 'sellers', title: 'Sellers', route: '/dashboard/ecommerce-page/sellers', permission: 'ecommerce.sellers.view' },
        ]
      },
      {
        id: 'crm-page',
        title: 'CRM',
        icon: 'group',
        // permission: 'pages.crm',
        children: [
          { id: 'contacts', title: 'Contacts', route: '/dashboard/crm-page', permission: 'crm.contacts.view' },
          { id: 'customers', title: 'Customers', route: '/dashboard/crm-page/customers', permission: 'crm.customers.view' },
          { id: 'leads', title: 'Leads', route: '/dashboard/crm-page/leads', permission: 'crm.leads.view' },
          { id: 'deals', title: 'Deals', route: '/dashboard/crm-page/deals', permission: 'crm.deals.view' },
        ]
      },
      {
        id: 'doctor-page',
        title: 'Doctor',
        icon: 'medical_services',
        // permission: 'pages.doctor',
        children: [
          { id: 'patients', title: 'Patients List', route: '/dashboard/doctor-page', permission: 'doctor.patients.view' },
          { id: 'add-patient', title: 'Add Patient', route: '/dashboard/doctor-page/add-patient', permission: 'doctor.patients.create' },
          { id: 'appointments', title: 'Appointments', route: '/dashboard/doctor-page/appointments', permission: 'doctor.appointments.view' },
          { id: 'prescriptions', title: 'Prescriptions', route: '/dashboard/doctor-page/prescriptions', permission: 'doctor.prescriptions.view' },
        ]
      },
      {
        id: 'invoices',
        title: 'Invoices',
        icon: 'receipt_long',
        // permission: 'pages.invoices',
        children: [
          { id: 'invoices-list', title: 'Invoices', route: '/dashboard/invoices', permission: 'invoices.view' },
          { id: 'create-invoice', title: 'Create Invoice', route: '/dashboard/invoices/create-invoice', permission: 'invoices.create' },
        ]
      },
      {
        id: 'users',
        title: 'Users',
        icon: 'person',
        // permission: 'pages.users',
        children: [
          { id: 'team-members', title: 'Team Members', route: '/dashboard/users', permission: 'users.view' },
          { id: 'users-list', title: 'Users List', route: '/dashboard/users/users-list', permission: 'users.list' },
          { id: 'add-user', title: 'Add User', route: '/dashboard/users/add-user', permission: 'users.create' },
        ]
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    order: 3,
    items: [
      {
        id: 'my-profile',
        title: 'My Profile',
        icon: 'account_circle',
        route: '/dashboard/my-profile',
        // permission: 'profile.view'
      },
      {
        id: 'settings',
        title: 'Settings',
        icon: 'settings',
        // permission: 'settings.view',
        children: [
          { id: 'account-settings', title: 'Account Settings', route: '/dashboard/settings', permission: 'settings.account' },
          { id: 'change-password', title: 'Change Password', route: '/dashboard/settings/change-password', permission: 'settings.password' },
          { id: 'connections', title: 'Connections', route: '/dashboard/settings/connections', permission: 'settings.connections' },
          { id: 'privacy-policy', title: 'Privacy Policy', route: '/dashboard/settings/privacy-policy' },
          { id: 'terms-conditions', title: 'Terms & Conditions', route: '/dashboard/settings/terms-conditions' },
        ]
      }
    ]
  }
];
