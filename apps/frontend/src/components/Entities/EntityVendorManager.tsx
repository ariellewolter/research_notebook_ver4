import React, { useState, useEffect, useCallback } from 'react';
import { EntityType } from '../../types/entity.types';

interface EntityVendorManagerProps {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  currentVendorInfo?: VendorInfo;
  onVendorUpdate?: (vendorInfo: VendorInfo) => void;
  className?: string;
}

interface VendorInfo {
  name: string;
  catalogNumber: string;
  purchaseDate: string;
  cost: number;
  lotNumber?: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierWebsite?: string;
  warrantyInfo?: string;
  returnPolicy?: string;
  notes?: string;
}

interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  isActive: boolean;
}

export const EntityVendorManager: React.FC<EntityVendorManagerProps> = ({
  entityId,
  entityType,
  entityName,
  currentVendorInfo,
  onVendorUpdate,
  className = ''
}) => {
  const [vendorInfo, setVendorInfo] = useState<VendorInfo>(currentVendorInfo || {
    name: '',
    catalogNumber: '',
    purchaseDate: '',
    cost: 0,
    lotNumber: '',
    supplierContact: '',
    supplierEmail: '',
    supplierPhone: '',
    supplierWebsite: '',
    warrantyInfo: '',
    returnPolicy: '',
    notes: ''
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showVendorSelector, setShowVendorSelector] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  // Load available vendors
  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      // This would typically come from an API
      // For now, using mock data
      const mockVendors: Vendor[] = [
        {
          id: 'vendor-1',
          name: 'Sigma-Aldrich',
          contactPerson: 'John Smith',
          email: 'orders@sigmaaldrich.com',
          phone: '+1-800-325-3010',
          website: 'https://www.sigmaaldrich.com',
          address: '3050 Spruce St, St. Louis, MO 63103',
          isActive: true
        },
        {
          id: 'vendor-2',
          name: 'Thermo Fisher Scientific',
          contactPerson: 'Sarah Johnson',
          email: 'orders@thermofisher.com',
          phone: '+1-800-678-5599',
          website: 'https://www.thermofisher.com',
          address: '168 Third Avenue, Waltham, MA 02451',
          isActive: true
        },
        {
          id: 'vendor-3',
          name: 'New England Biolabs',
          contactPerson: 'Mike Davis',
          email: 'orders@neb.com',
          phone: '+1-800-632-5227',
          website: 'https://www.neb.com',
          address: '240 County Road, Ipswich, MA 01938',
          isActive: true
        },
        {
          id: 'vendor-4',
          name: 'Bio-Rad Laboratories',
          contactPerson: 'Lisa Wilson',
          email: 'orders@bio-rad.com',
          phone: '+1-800-424-6723',
          website: 'https://www.bio-rad.com',
          address: '1000 Alfred Nobel Dr, Hercules, CA 94547',
          isActive: true
        },
        {
          id: 'vendor-5',
          name: 'VWR International',
          contactPerson: 'David Brown',
          email: 'orders@vwr.com',
          phone: '+1-800-932-5000',
          website: 'https://www.vwr.com',
          address: '100 Matsonford Rd, Radnor, PA 19087',
          isActive: true
        }
      ];

      setVendors(mockVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new vendor
  const handleAddVendor = useCallback(async () => {
    if (!newVendor.name.trim()) return;

    try {
      const vendor: Vendor = {
        id: `new-${Date.now()}`,
        name: newVendor.name,
        contactPerson: newVendor.contactPerson,
        email: newVendor.email,
        phone: newVendor.phone,
        website: newVendor.website,
        address: newVendor.address,
        isActive: true
      };

      setVendors(prev => [...prev, vendor]);

      // Reset form
      setNewVendor({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        address: ''
      });
      setShowAddVendor(false);
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  }, [newVendor]);

  // Select vendor
  const handleVendorSelect = useCallback((vendor: Vendor) => {
    setVendorInfo(prev => ({
      ...prev,
      name: vendor.name,
      supplierContact: vendor.contactPerson || '',
      supplierEmail: vendor.email || '',
      supplierPhone: vendor.phone || '',
      supplierWebsite: vendor.website || ''
    }));
    setShowVendorSelector(false);
  }, []);

  // Update vendor info
  const handleVendorInfoUpdate = useCallback(async () => {
    try {
      onVendorUpdate?.(vendorInfo);
    } catch (error) {
      console.error('Error updating vendor info:', error);
    }
  }, [vendorInfo, onVendorUpdate]);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Vendor Information
          </h3>
          <p className="text-sm text-gray-500">
            Manage vendor details for {entityName}
          </p>
        </div>
        <button
          onClick={() => setShowVendorSelector(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Select Vendor
        </button>
      </div>

      {/* Current Vendor Info */}
      {vendorInfo.name && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-lg">🏢</span>
            <div>
              <p className="font-medium text-blue-900">{vendorInfo.name}</p>
              <p className="text-sm text-blue-700">Current vendor</p>
            </div>
          </div>
          {vendorInfo.catalogNumber && (
            <p className="text-sm text-blue-700">
              <span className="font-medium">Catalog #:</span> {vendorInfo.catalogNumber}
            </p>
          )}
          {vendorInfo.purchaseDate && (
            <p className="text-sm text-blue-700">
              <span className="font-medium">Purchase Date:</span> {formatDate(vendorInfo.purchaseDate)}
            </p>
          )}
        </div>
      )}

      {/* Vendor Information Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Vendor Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              type="text"
              value={vendorInfo.name}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Sigma-Aldrich"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catalog Number
            </label>
            <input
              type="text"
              value={vendorInfo.catalogNumber}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, catalogNumber: e.target.value }))}
              placeholder="e.g., S9888"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              value={vendorInfo.purchaseDate}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, purchaseDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={vendorInfo.cost}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lot Number
            </label>
            <input
              type="text"
              value={vendorInfo.lotNumber}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, lotNumber: e.target.value }))}
              placeholder="e.g., 123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={vendorInfo.supplierContact}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, supplierContact: e.target.value }))}
              placeholder="e.g., John Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={vendorInfo.supplierEmail}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, supplierEmail: e.target.value }))}
              placeholder="orders@vendor.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={vendorInfo.supplierPhone}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, supplierPhone: e.target.value }))}
              placeholder="+1-800-123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={vendorInfo.supplierWebsite}
              onChange={(e) => setVendorInfo(prev => ({ ...prev, supplierWebsite: e.target.value }))}
              placeholder="https://www.vendor.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warranty Information
          </label>
          <textarea
            value={vendorInfo.warrantyInfo}
            onChange={(e) => setVendorInfo(prev => ({ ...prev, warrantyInfo: e.target.value }))}
            placeholder="Warranty details..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Return Policy
          </label>
          <textarea
            value={vendorInfo.returnPolicy}
            onChange={(e) => setVendorInfo(prev => ({ ...prev, returnPolicy: e.target.value }))}
            placeholder="Return policy details..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={vendorInfo.notes}
            onChange={(e) => setVendorInfo(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional vendor notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleVendorInfoUpdate}
            disabled={!vendorInfo.name.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Vendor Info
          </button>
        </div>
      </div>

      {/* Vendor Selector Modal */}
      {showVendorSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Vendor
            </h3>

            <div className="space-y-2">
              {vendors.filter(vendor => vendor.isActive).map(vendor => (
                <button
                  key={vendor.id}
                  onClick={() => handleVendorSelect(vendor)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{vendor.name}</p>
                      {vendor.contactPerson && (
                        <p className="text-sm text-gray-500">Contact: {vendor.contactPerson}</p>
                      )}
                      {vendor.email && (
                        <p className="text-xs text-gray-400">{vendor.email}</p>
                      )}
                    </div>
                    <span className="text-blue-600">→</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Add New Vendor */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddVendor(true)}
                className="w-full text-center py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700"
              >
                + Add New Vendor
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowVendorSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Vendor
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sigma-Aldrich"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={newVendor.contactPerson}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="orders@vendor.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1-800-123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={newVendor.website}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.vendor.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newVendor.address}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Vendor address..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddVendor(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVendor}
                disabled={!newVendor.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 