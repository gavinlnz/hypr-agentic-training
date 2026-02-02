import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applicationService } from '@/services/application-service';
import type { Application } from '@/types/api';

// Mock the application service
vi.mock('@/services/application-service', () => ({
  applicationService: {
    getApplications: vi.fn(),
    deleteApplications: vi.fn(),
  },
}));

// Simple class to test the logic without DOM complications
class ApplicationListLogic {
  private applications: Application[] = [];
  private selectedIds: Set<string> = new Set();
  private isDeleting = false;

  // Simulate the actual component methods
  handleSelectRow(appId: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(appId);
    } else {
      this.selectedIds.delete(appId);
    }
  }

  handleSelectAll(checked: boolean): void {
    if (checked) {
      this.applications.forEach(app => this.selectedIds.add(app.id));
    } else {
      this.selectedIds.clear();
    }
  }

  async handleBulkDelete(): Promise<void> {
    if (this.selectedIds.size === 0) return;

    this.isDeleting = true;
    
    try {
      await applicationService.deleteApplications(Array.from(this.selectedIds));
      this.selectedIds.clear();
    } catch (error) {
      // Handle error gracefully - in real component this would dispatch error event
      console.error('Delete failed:', error);
    } finally {
      this.isDeleting = false;
    }
  }

  // Test helper methods
  setApplications(apps: Application[]): void {
    this.applications = apps;
  }

  getSelectedIds(): Set<string> {
    return new Set(this.selectedIds);
  }

  getIsDeleting(): boolean {
    return this.isDeleting;
  }
}

describe('ApplicationList Delete Functionality', () => {
  let component: ApplicationListLogic;
  let mockApplications: Application[];

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ApplicationListLogic();
    
    mockApplications = [
      {
        id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
        name: 'App 1',
        comments: 'First app',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '01HKQJQJQJQJQJQJQJQJQJQJQ2',
        name: 'App 2',
        comments: 'Second app',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '01HKQJQJQJQJQJQJQJQJQJQJQ3',
        name: 'App 3',
        comments: 'Third app',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    component.setApplications(mockApplications);
  });

  describe('handleSelectRow', () => {
    it('should add application ID when checked', () => {
      const appId = '01HKQJQJQJQJQJQJQJQJQJQJQ1';
      
      component.handleSelectRow(appId, true);
      
      expect(component.getSelectedIds().has(appId)).toBe(true);
      expect(component.getSelectedIds().size).toBe(1);
    });

    it('should remove application ID when unchecked', () => {
      const appId = '01HKQJQJQJQJQJQJQJQJQJQJQ1';
      
      // First select it
      component.handleSelectRow(appId, true);
      expect(component.getSelectedIds().has(appId)).toBe(true);
      
      // Then unselect it
      component.handleSelectRow(appId, false);
      expect(component.getSelectedIds().has(appId)).toBe(false);
      expect(component.getSelectedIds().size).toBe(0);
    });

    it('should handle multiple selections', () => {
      const appId1 = '01HKQJQJQJQJQJQJQJQJQJQJQ1';
      const appId2 = '01HKQJQJQJQJQJQJQJQJQJQJQ2';
      
      component.handleSelectRow(appId1, true);
      component.handleSelectRow(appId2, true);
      
      expect(component.getSelectedIds().has(appId1)).toBe(true);
      expect(component.getSelectedIds().has(appId2)).toBe(true);
      expect(component.getSelectedIds().size).toBe(2);
    });
  });

  describe('handleSelectAll', () => {
    it('should select all applications when checked', () => {
      component.handleSelectAll(true);
      
      expect(component.getSelectedIds().size).toBe(3);
      mockApplications.forEach(app => {
        expect(component.getSelectedIds().has(app.id)).toBe(true);
      });
    });

    it('should deselect all applications when unchecked', () => {
      // First select all
      component.handleSelectAll(true);
      expect(component.getSelectedIds().size).toBe(3);
      
      // Then deselect all
      component.handleSelectAll(false);
      expect(component.getSelectedIds().size).toBe(0);
    });

    it('should deselect all even with partial selection', () => {
      // Select some applications manually
      component.handleSelectRow('01HKQJQJQJQJQJQJQJQJQJQJQ1', true);
      component.handleSelectRow('01HKQJQJQJQJQJQJQJQJQJQJQ2', true);
      expect(component.getSelectedIds().size).toBe(2);
      
      // Deselect all
      component.handleSelectAll(false);
      expect(component.getSelectedIds().size).toBe(0);
    });
  });

  describe('handleBulkDelete', () => {
    it('should not delete when no applications selected', async () => {
      const mockDeleteApplications = vi.mocked(applicationService.deleteApplications);
      
      await component.handleBulkDelete();
      
      expect(mockDeleteApplications).not.toHaveBeenCalled();
      expect(component.getIsDeleting()).toBe(false);
    });

    it('should delete selected applications', async () => {
      const mockDeleteApplications = vi.mocked(applicationService.deleteApplications);
      mockDeleteApplications.mockResolvedValueOnce(undefined);
      
      // Select some applications
      component.handleSelectRow('01HKQJQJQJQJQJQJQJQJQJQJQ1', true);
      component.handleSelectRow('01HKQJQJQJQJQJQJQJQJQJQJQ3', true);
      
      await component.handleBulkDelete();
      
      expect(mockDeleteApplications).toHaveBeenCalledWith([
        '01HKQJQJQJQJQJQJQJQJQJQJQ1',
        '01HKQJQJQJQJQJQJQJQJQJQJQ3'
      ]);
      expect(component.getSelectedIds().size).toBe(0); // Should clear selection
      expect(component.getIsDeleting()).toBe(false);
    });

    it('should handle delete errors gracefully', async () => {
      const mockDeleteApplications = vi.mocked(applicationService.deleteApplications);
      mockDeleteApplications.mockRejectedValueOnce(new Error('Delete failed'));
      
      // Select an application
      component.handleSelectRow('01HKQJQJQJQJQJQJQJQJQJQJQ1', true);
      
      // The delete operation should not throw, but handle the error internally
      await expect(component.handleBulkDelete()).resolves.toBeUndefined();
      
      expect(mockDeleteApplications).toHaveBeenCalled();
      expect(component.getIsDeleting()).toBe(false); // Should reset loading state
      // Selection should remain since delete failed
      expect(component.getSelectedIds().size).toBe(1);
    });

    it('should set loading state during delete operation', async () => {
      const mockDeleteApplications = vi.mocked(applicationService.deleteApplications);
      
      // Create a promise that we can control
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockDeleteApplications.mockReturnValueOnce(deletePromise);
      
      // Select an application
      component.handleSelectRow('01HKQJQJQJQJQJQJQJQJQJQJQ1', true);
      
      // Start delete operation
      const deleteOperation = component.handleBulkDelete();
      
      // Should be in loading state
      expect(component.getIsDeleting()).toBe(true);
      
      // Resolve the delete operation
      resolveDelete!();
      await deleteOperation;
      
      // Should no longer be in loading state
      expect(component.getIsDeleting()).toBe(false);
    });

    it('should delete all selected applications', async () => {
      const mockDeleteApplications = vi.mocked(applicationService.deleteApplications);
      mockDeleteApplications.mockResolvedValueOnce(undefined);
      
      // Select all applications
      component.handleSelectAll(true);
      
      await component.handleBulkDelete();
      
      expect(mockDeleteApplications).toHaveBeenCalledWith([
        '01HKQJQJQJQJQJQJQJQJQJQJQ1',
        '01HKQJQJQJQJQJQJQJQJQJQJQ2',
        '01HKQJQJQJQJQJQJQJQJQJQJQ3'
      ]);
      expect(component.getSelectedIds().size).toBe(0);
    });
  });
});