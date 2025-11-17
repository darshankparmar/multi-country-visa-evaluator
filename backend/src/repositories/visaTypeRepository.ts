import { VisaType } from '../models/VisaType';
import { IVisaType } from '../types/visaType.types';

/**
 * In-memory cache for visa types
 * Reduces database queries for frequently accessed data
 */
class VisaTypeCache {
  private cache: Map<string, IVisaType[]>;
  private fullCacheKey = '__ALL_VISA_TYPES__';
  private lastUpdated: Date | null;

  constructor() {
    this.cache = new Map();
    this.lastUpdated = null;
  }

  /**
   * Get all visa types from cache
   */
  getAll(): IVisaType[] | null {
    return this.cache.get(this.fullCacheKey) || null;
  }

  /**
   * Get visa types by country from cache
   */
  getByCountry(country: string): IVisaType[] | null {
    return this.cache.get(this.getCacheKey(country)) || null;
  }

  /**
   * Set all visa types in cache
   */
  setAll(visaTypes: IVisaType[]): void {
    this.cache.set(this.fullCacheKey, visaTypes);
    this.lastUpdated = new Date();

    // Also cache by country for faster lookups
    const byCountry = new Map<string, IVisaType[]>();
    visaTypes.forEach(vt => {
      const country = vt.country;
      if (!byCountry.has(country)) {
        byCountry.set(country, []);
      }
      byCountry.get(country)!.push(vt);
    });

    byCountry.forEach((types, country) => {
      this.cache.set(this.getCacheKey(country), types);
    });
  }

  /**
   * Invalidate entire cache
   */
  invalidate(): void {
    this.cache.clear();
    this.lastUpdated = null;
  }

  /**
   * Invalidate cache for specific country
   */
  invalidateCountry(country: string): void {
    this.cache.delete(this.getCacheKey(country));
    // Also invalidate full cache since it contains this country
    this.cache.delete(this.fullCacheKey);
  }

  /**
   * Check if cache is populated
   */
  isPopulated(): boolean {
    return this.cache.size > 0;
  }

  /**
   * Get cache key for country
   */
  private getCacheKey(country: string): string {
    return `country:${country.toLowerCase()}`;
  }

  /**
   * Get last updated timestamp
   */
  getLastUpdated(): Date | null {
    return this.lastUpdated;
  }
}

/**
 * Repository for VisaType data access
 * Provides type-safe methods for querying visa types with caching
 */
export class VisaTypeRepository {
  private cache: VisaTypeCache;

  constructor() {
    this.cache = new VisaTypeCache();
  }

  /**
   * Find all visa types
   * Uses cache if available, otherwise queries database
   * @param activeOnly - Filter for active visa types only
   * @returns Array of visa type documents
   */
  async findAll(activeOnly: boolean = true): Promise<IVisaType[]> {
    // Check cache first
    const cached = this.cache.getAll();
    if (cached) {
      return activeOnly ? cached.filter(vt => vt.active) : cached;
    }

    // Query database
    const query = activeOnly ? { active: true } : {};
    const visaTypes = await VisaType.find(query)
      .sort({ country: 1, visaType: 1 })
      .exec();

    // Populate cache with all results
    if (visaTypes.length > 0) {
      this.cache.setAll(visaTypes);
    }

    return visaTypes;
  }

  /**
   * Find visa types by country
   * Uses cache if available, otherwise queries database
   * @param country - Country name
   * @param activeOnly - Filter for active visa types only
   * @returns Array of visa type documents for the country
   */
  async findByCountry(country: string, activeOnly: boolean = true): Promise<IVisaType[]> {
    // Check cache first
    const cached = this.cache.getByCountry(country);
    if (cached) {
      return activeOnly ? cached.filter(vt => vt.active) : cached;
    }

    // Query database
    const query: any = { country };
    if (activeOnly) {
      query.active = true;
    }

    const visaTypes = await VisaType.find(query)
      .sort({ visaType: 1 })
      .exec();

    // If cache is not populated, populate it with all visa types
    if (!this.cache.isPopulated()) {
      await this.findAll(false); // This will populate the cache
    }

    return visaTypes;
  }

  /**
   * Find specific visa type by country and visa type name
   * @param country - Country name
   * @param visaType - Visa type name
   * @returns Visa type document or null if not found
   */
  async findByCountryAndType(country: string, visaType: string): Promise<IVisaType | null> {
    // Try to find in cache first
    const countryTypes = this.cache.getByCountry(country);
    if (countryTypes) {
      const found = countryTypes.find(
        vt => vt.visaType.toLowerCase() === visaType.toLowerCase()
      );
      if (found) {
        return found;
      }
    }

    // Query database
    return await VisaType.findOne({ country, visaType }).exec();
  }

  /**
   * Create a new visa type
   * Invalidates cache after creation
   * @param data - Visa type data to create
   * @returns Created visa type document
   */
  async create(data: Partial<IVisaType>): Promise<IVisaType> {
    const visaType = new VisaType(data);
    const saved = await visaType.save();

    // Invalidate cache
    this.cache.invalidate();

    return saved;
  }

  /**
   * Update visa type
   * Invalidates cache after update
   * @param country - Country name
   * @param visaType - Visa type name
   * @param data - Partial visa type data to update
   * @returns Updated visa type document or null if not found
   */
  async update(
    country: string,
    visaType: string,
    data: Partial<IVisaType>
  ): Promise<IVisaType | null> {
    const updated = await VisaType.findOneAndUpdate(
      { country, visaType },
      { $set: data },
      { new: true, runValidators: true }
    ).exec();

    if (updated) {
      // Invalidate cache for this country
      this.cache.invalidateCountry(country);
    }

    return updated;
  }

  /**
   * Delete visa type
   * Invalidates cache after deletion
   * @param country - Country name
   * @param visaType - Visa type name
   * @returns Deleted visa type document or null if not found
   */
  async delete(country: string, visaType: string): Promise<IVisaType | null> {
    const deleted = await VisaType.findOneAndDelete({ country, visaType }).exec();

    if (deleted) {
      // Invalidate cache for this country
      this.cache.invalidateCountry(country);
    }

    return deleted;
  }

  /**
   * Get all unique countries
   * @returns Array of unique country names
   */
  async getCountries(): Promise<string[]> {
    const countries = await VisaType.distinct('country', { active: true }).exec();
    return countries.sort();
  }

  /**
   * Check if visa type exists
   * @param country - Country name
   * @param visaType - Visa type name
   * @returns True if visa type exists, false otherwise
   */
  async exists(country: string, visaType: string): Promise<boolean> {
    const found = await this.findByCountryAndType(country, visaType);
    return found !== null;
  }

  /**
   * Manually invalidate cache
   * Useful for testing or when external updates occur
   */
  invalidateCache(): void {
    this.cache.invalidate();
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getCacheStats(): { isPopulated: boolean; lastUpdated: Date | null } {
    return {
      isPopulated: this.cache.isPopulated(),
      lastUpdated: this.cache.getLastUpdated()
    };
  }
}
