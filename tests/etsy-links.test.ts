import assert from 'node:assert/strict';
import test from 'node:test';
import { getCanonicalEtsyUrl, normalizeEtsyTitle } from '../lib/etsy.js';
import { makeEtsyCatalogCsv } from '../src/utils/etsyCsv.js';
import { etsyImageUrls, moneyFromEtsy, mapEtsyApiItem, toStoreEtsyProduct, decodeEtsyText, isEtsyPriceStale } from '../lib/etsyCatalog.js';
import { titleMatchType, suggestUniqueTitleMatches } from '../lib/etsyMatching.js';
import { findLikelyDuplicateProducts, selectVisibleProductKeys } from '../lib/catalogSafety.js';

test('normalizes exact product titles without making fuzzy guesses', () => {
  assert.equal(normalizeEtsyTitle('  Bébé   Shirt — Blue! '), 'bebe shirt blue');
  assert.equal(normalizeEtsyTitle('Custom T-Shirt'), 'custom t shirt');
  assert.notEqual(normalizeEtsyTitle('Custom T-Shirt'), normalizeEtsyTitle('Custom T-Shirt XL'));
});

test('constructs only safe Etsy listing destinations', () => {
  assert.equal(getCanonicalEtsyUrl('123456789'), 'https://www.etsy.com/listing/123456789');
  assert.equal(getCanonicalEtsyUrl('12345/../evil'), null);
  assert.equal(getCanonicalEtsyUrl('https://evil.example/123'), null);
  assert.equal(getCanonicalEtsyUrl('123?redirect=https://evil.example'), null);
  assert.equal(getCanonicalEtsyUrl(''), null);
});

test('exports all Etsy URLs as Excel-friendly, formula-safe CSV', () => {
  const csv = makeEtsyCatalogCsv([
    { listingId: '123', title: '=SUM(1,2)', url: 'https://www.etsy.com/listing/123', productName: 'A "custom" shirt' },
    { listingId: '124', title: 'Baby Shirt', url: 'https://www.etsy.com/listing/124', productName: '' },
  ]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"A ""custom"" shirt"'));
  assert.ok(csv.includes('https://www.etsy.com/listing/124'));
  assert.equal(csv.split('\r\n').filter(Boolean).length, 3);
});

test('matches full leading product name in longer Etsy SEO title', () => {
  assert.equal(titleMatchType('Personalized One Today 1st Birthday Shirt', 'Personalized One Today 1st Birthday Shirt, Colorful Smiley Face'), 'prefix');
  assert.equal(titleMatchType('Custom Shirt', 'Custom Shirt, Baby'), null);
  assert.equal(titleMatchType('Three Rex 3rd Birthday Shirt', 'Three Rex 3rd Birthday Shirt'), 'exact');
  assert.equal(titleMatchType('Birthday Shirt', 'Fancy Birthday Shirt'), null);
});

test('avoids duplicate and already mapped site product suggestions', () => {
  const products = [{id:'a',name:'Personalized Two Cool 2nd Birthday Shirt'},{id:'b',name:'Personalized Three Rex 3rd Birthday Shirt'}];
  const listings = [{listingId:'10',title:'Personalized Two Cool 2nd Birthday Shirt, Cute Race Car',offset:0},{listingId:'11',title:'Personalized Three Rex 3rd Birthday Shirt, Dinosaur Party',offset:0}];
  assert.equal(suggestUniqueTitleMatches(products,listings,[]).length,2);
  assert.equal(suggestUniqueTitleMatches(products,listings,[{productId:'a',listingId:'10'}]).length,1);
  assert.equal(suggestUniqueTitleMatches([...products,{id:'c',name:products[0].name}],listings,[]).length,1);
  assert.equal(suggestUniqueTitleMatches(products,[...listings,{listingId:'12',title:listings[0].title,offset:100}],[]).length,1);
});

test('Etsy money keeps its native currency and decimal divisor', () => {
  assert.deepEqual(moneyFromEtsy({ amount: 1599, divisor: 100, currency_code: 'EUR' }), { price: 15.99, currency: 'EUR' });
  assert.equal(moneyFromEtsy({ amount: 1599, divisor: 0, currency_code: 'USD' }), null);
});

test('only images hosted by Etsy are accepted', () => {
  const images = etsyImageUrls({ images: [
    { rank: 2, url_570xN: 'https://i.etsystatic.com/safe2.jpg' },
    { rank: 1, url_570xN: 'https://example.com/unsafe.jpg' },
    { rank: 0, url_570xN: 'https://i.etsystatic.com/safe1.jpg' },
  ]});
  assert.deepEqual(images, ['https://i.etsystatic.com/safe1.jpg', 'https://i.etsystatic.com/safe2.jpg']);
});

test('only active listings belonging to the configured shop can be imported', () => {
  const listing = { listing_id: 123, shop_id: 42, state: 'active', title: 'Birthday Shirt',
    price: { amount: 1200, divisor: 100, currency_code: 'USD' },
    images: [{ rank: 1, url_570xN: 'https://i.etsystatic.com/a.jpg' }] };
  assert.equal(mapEtsyApiItem({ ...listing, shop_id: 43 }, 42), null);
  assert.equal(mapEtsyApiItem({ ...listing, state: 'inactive' }, 42), null);
  assert.equal(mapEtsyApiItem(listing, 42)?.images.length, 1);
});

test('published Etsy catalog products have an Etsy checkout destination', () => {
  const item = toStoreEtsyProduct({
    listing_id: '123', etsy_title: 'Original name', description: 'Custom shirt', price: 14.5,
    currency_code: 'EUR', quantity: 3, image_urls: ['https://i.etsystatic.com/a.jpg'],
    active: true, published: true, category_id: null, custom_title: 'Short title', synced_at: new Date(),
  });
  assert.equal(item.slug, 'etsy-123');
  assert.equal(item.name, 'Short title');
  assert.equal(item.priceCurrency, 'EUR');
  assert.equal(item.etsyUrl, 'https://www.etsy.com/listing/123');
});

test('Etsy HTML entities are rendered as readable product text', () => {
  assert.equal(decodeEtsyText('It&#39;s My First Birthday &amp; More'), "It's My First Birthday & More");
});

test('keeps Etsy products catalog-visible but does not show stale prices', () => {
  const stale = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const item = {
    listing_id: '12345', etsy_title: 'Custom Birthday Shirt',
    description: 'Made to order', price: 24, currency_code: 'EUR', quantity: 5,
    image_urls: ['https://i.etsystatic.com/item.jpg'], active: true, published: true,
    category_id: null, custom_title: null, synced_at: stale,
  };
  assert.equal(isEtsyPriceStale(stale), true);
  const card = toStoreEtsyProduct(item);
  assert.equal(card.priceStale, true);
  assert.equal(card.price, 0);
  assert.equal(card.etsyUrl, 'https://www.etsy.com/listing/12345');
  const fresh = toStoreEtsyProduct({ ...item, synced_at: new Date() });
  assert.equal(fresh.priceStale, false);
  assert.equal(fresh.price, 24);
});

test('high-confidence duplicate candidates must be reviewed', () => {
  const candidates = [
    { id: 'a', name: 'Personalized One Today 1st Birthday Shirt', status: 'active' },
    { id: 'b', name: 'Different Halloween Costume', status: 'active' },
    { id: 'c', name: 'Personalized One Today 1st Birthday Shirt', status: 'archived' },
  ];
  const matches = findLikelyDuplicateProducts(
    'Personalized One Today 1st Birthday Shirt, Custom Name', candidates,
  );
  assert.deepEqual(matches.map(item => item.id), ['a']);
  assert.deepEqual(findLikelyDuplicateProducts('Completely Unique Product With Cats', candidates), []);
});

test('filtered bulk selection excludes invisible products', () => {
  assert.deepEqual(
    selectVisibleProductKeys(['etsy:10','site:abc','etsy:11'], ['etsy:11']),
    ['etsy:11'],
  );
  assert.deepEqual(selectVisibleProductKeys(['etsy:10'], []), []);
});
