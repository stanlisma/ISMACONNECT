do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listings'
      and column_name = 'subcategory'
  ) then
    alter table public.listings
      drop constraint if exists valid_subcategories;

    alter table public.listings
      add constraint valid_subcategories check (
        subcategory is null
        or case category
          when 'rentals' then subcategory in (
            'apartments',
            'houses',
            'rooms-shared',
            'basement-suites',
            'short-term-rentals',
            'parking-storage',
            'commercial-space',
            'rooms-for-rent',
            'furnished-rentals',
            'storage-parking'
          )
          when 'ride-share' then subcategory in (
            'daily-commute',
            'one-time-ride',
            'airport-ride',
            'camp-site-transport',
            'long-distance-ride',
            'delivery-item-transport',
            'one-time-rides',
            'airport-rides',
            'camp-rides',
            'edmonton-calgary-trips',
            'drivers-available'
          )
          when 'jobs' then subcategory in (
            'construction-trades',
            'oilfield-camp-site',
            'general-labour',
            'driving-delivery',
            'hospitality',
            'healthcare',
            'admin-office',
            'other-jobs',
            'full-time',
            'part-time',
            'contract',
            'camp-jobs',
            'skilled-trades'
          )
          when 'services' then subcategory in (
            'skilled-trades',
            'cleaning',
            'home-services',
            'moving-hauling',
            'automotive-services',
            'beauty-wellness',
            'lessons-tutoring',
            'business-services',
            'senior-care',
            'other-services',
            'moving',
            'repairs-handyman',
            'tutoring',
            'beauty-personal-care'
          )
          when 'buy-sell' then subcategory in (
            'furniture',
            'electronics',
            'phones',
            'computers',
            'home',
            'tools-equipment',
            'clothing',
            'baby-kids',
            'auto-parts',
            'sports-outdoors',
            'free-stuff',
            'wanted',
            'other-buy-sell',
            'appliances',
            'baby-kids-items',
            'vehicles-parts'
          )
          else false
        end
      );
  end if;
end
$$;

comment on table public.listings is 'Marketplace listings with category-aware subcategory validation aligned to the current ISMACONNECT taxonomy.';
