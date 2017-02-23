import assert from 'assert';
import GraphQLJSClient from '@shopify/graphql-js-client';
import Config from '../src-graphql/config';
import Client from '../src-graphql/client';
import types from '../types';
import base64Encode from '../src-graphql/base64encode';
import singleProductFixture from '../fixtures/product-fixture';
import shopWithProductsFixture from '../fixtures/shop-with-products-fixture';
import shopWithCollectionsFixture from '../fixtures/shop-with-collections-fixture';
import singleCollectionFixture from '../fixtures/collection-fixture';
import dynamicProductFixture from '../fixtures/dynamic-product-fixture';
import dynamicCollectionFixture from '../fixtures/dynamic-collection-fixture';
import productWithPaginatedImagesFixture from '../fixtures/product-with-paginated-images-fixture';
import {secondPageImagesFixture, thirdPageImagesFixture, emptyPageImagesFixture} from '../fixtures/paginated-images-fixtures';
import productWithPaginatedVariantsFixture from '../fixtures/product-with-paginated-variants-fixture';
import {secondPageVariantsFixture, thirdPageVariantsFixture, emptyPageVariantsFixture} from '../fixtures/paginated-variants-fixtures';
import queryProductFixture from '../fixtures/query-product-fixture';
import queryCollectionFixture from '../fixtures/query-collection-fixture';
import fetchMock from './isomorphic-fetch-mock'; // eslint-disable-line import/no-unresolved
import productQuery from '../src-graphql/product-query';
import imageQuery from '../src-graphql/image-query';
import imageConnectionQuery from '../src-graphql/image-connection-query';
import optionQuery from '../src-graphql/option-query';
import variantConnectionQuery from '../src-graphql/variant-connection-query';
import collectionQuery from '../src-graphql/collection-query';
import productConnectionQuery from '../src-graphql/product-connection-query';
import collectionConnectionQuery from '../src-graphql/collection-connection-query';

suite('client-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  teardown(() => {
    fetchMock.restore();
  });

  test('it instantiates a GraphQL client with the given config', () => {
    let passedTypeBundle;
    let passedUrl;
    let passedFetcherOptions;

    class FakeGraphQLJSClient {
      constructor(typeBundle, {url, fetcherOptions}) {
        passedTypeBundle = typeBundle;
        passedUrl = url;
        passedFetcherOptions = fetcherOptions;
      }
    }

    const config = new Config({
      domain: 'sendmecats.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    new Client(config, FakeGraphQLJSClient); // eslint-disable-line no-new

    assert.equal(passedTypeBundle, types);
    assert.equal(passedUrl, 'https://sendmecats.myshopify.com/api/graphql');
    assert.deepEqual(passedFetcherOptions, {
      headers: {
        Authorization: `Basic ${base64Encode(config.storefrontAccessToken)}`
      }
    });
  });

  test('it creates an instance of the GraphQLJSClient by default', () => {
    const config = new Config({
      domain: 'sendmecats.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    assert.ok(GraphQLJSClient.prototype.isPrototypeOf(client.graphQLClient));
  });

  test('it resolves with an array of products on Client#fetchAllProducts', () => {
    const config = new Config({
      domain: 'multiple-products.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://multiple-products.myshopify.com/api/graphql', shopWithProductsFixture);

    return client.fetchAllProducts().then((products) => {
      assert.ok(Array.isArray(products), 'products is an array');
      assert.equal(products.length, 2, 'there are two products');

      const [firstProduct, secondProduct] = products;
      const [firstProductFixture, secondProductFixture] = shopWithProductsFixture.data.shop.products.edges;

      assert.equal(firstProduct.id, firstProductFixture.node.id);
      assert.equal(secondProduct.id, secondProductFixture.node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with a single product on Client#fetchProduct', () => {
    const config = new Config({
      domain: 'single-product.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://single-product.myshopify.com/api/graphql', singleProductFixture);

    return client.fetchProduct('7857989384').then((product) => {
      assert.ok(Array.isArray(product) === false, 'product is not an array');
      assert.equal(product.id, singleProductFixture.data.node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with an array of collections on Client#fetchAllCollections', () => {
    const config = new Config({
      domain: 'multiple-collections.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://multiple-collections.myshopify.com/api/graphql', shopWithCollectionsFixture);

    return client.fetchAllCollections().then((collections) => {
      assert.ok(Array.isArray(collections), 'collections is an array');
      assert.equal(collections.length, 2, 'there are two collections');

      const [firstCollection, secondCollection] = collections;
      const [firstCollectionFixture, secondCollectionFixture] = shopWithCollectionsFixture.data.shop.collections.edges;

      assert.equal(firstCollection.id, firstCollectionFixture.node.id);
      assert.equal(secondCollection.id, secondCollectionFixture.node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with a single collection on Client#fetchCollection', () => {
    const config = new Config({
      domain: 'single-collection.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://single-collection.myshopify.com/api/graphql', singleCollectionFixture);

    return client.fetchCollection('369312584').then((collection) => {
      assert.ok(Array.isArray(collection) === false, 'collection is not an array');
      assert.equal(collection.id, singleCollectionFixture.data.node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it accepts product queries with dynamic fields', () => {
    const config = new Config({
      domain: 'dynamic-product-fields.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://dynamic-product-fields.myshopify.com/api/graphql', dynamicProductFixture);

    const queryFields = ['id', 'handle', 'title', 'updatedAt', ['images', imageConnectionQuery(['id', 'src'])], ['options', optionQuery(['name'])], ['variants', variantConnectionQuery(['price', 'weight'])]];

    return client.fetchProduct('7857989384', productQuery(queryFields)).then((product) => {
      assert.ok(Array.isArray(product) === false, 'product is not an array');
      assert.equal(product.id, dynamicProductFixture.data.node.id);
      assert.equal(typeof product.createdAt, 'undefined', 'unspecified fields are not queried');
      assert.ok(fetchMock.done());
    });
  });

  test('it accepts collection queries with dynamic fields', () => {
    const config = new Config({
      domain: 'dynamic-collection-fields.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://dynamic-collection-fields.myshopify.com/api/graphql', dynamicCollectionFixture);

    return client.fetchCollection('369312584', collectionQuery(['title', 'updatedAt', ['image', imageQuery(['src'])]])).then((collection) => {
      assert.ok(Array.isArray(collection) === false, 'collection is not an array');
      assert.equal(collection.updatedAt, dynamicCollectionFixture.data.node.updatedAt);
      assert.equal(typeof collection.id, 'undefined', 'unspecified fields are not queried');
      assert.ok(fetchMock.done());
    });
  });

  test('it fetches all images on products', () => {
    const config = new Config({
      domain: 'paginated-images.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://paginated-images.myshopify.com/api/graphql', productWithPaginatedImagesFixture)
      .postOnce('https://paginated-images.myshopify.com/api/graphql', secondPageImagesFixture)
      .postOnce('https://paginated-images.myshopify.com/api/graphql', thirdPageImagesFixture)
      .postOnce('https://paginated-images.myshopify.com/api/graphql', emptyPageImagesFixture);

    return client.fetchAllProducts().then((products) => {
      const images = products[0].images;

      assert.ok(Array.isArray(images), 'images is an array');
      // Each image page fixture only contains 1 image rather than 20 for simplicity
      assert.equal(images.length, 3, 'all three pages of images are returned');
      assert.equal(images[0].id, productWithPaginatedImagesFixture.data.shop.products.edges[0].node.images.edges[0].node.id);
      assert.equal(images[1].id, secondPageImagesFixture.data.node.images.edges[0].node.id);
      assert.equal(images[2].id, thirdPageImagesFixture.data.node.images.edges[0].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it fetches all variants on products', () => {
    const config = new Config({
      domain: 'paginated-variants.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://paginated-variants.myshopify.com/api/graphql', productWithPaginatedVariantsFixture)
      .postOnce('https://paginated-variants.myshopify.com/api/graphql', secondPageVariantsFixture)
      .postOnce('https://paginated-variants.myshopify.com/api/graphql', thirdPageVariantsFixture)
      .postOnce('https://paginated-variants.myshopify.com/api/graphql', emptyPageVariantsFixture);

    return client.fetchProduct('7857989384').then((product) => {
      const variants = product.variants;

      assert.ok(Array.isArray(variants), 'variants is an array');
      // Each variant page fixture only contains 1 variant rather than 20 for simplicity
      assert.equal(variants.length, 3, 'all three pages of variants are returned');
      assert.equal(variants[0].id, productWithPaginatedVariantsFixture.data.node.variants.edges[0].node.id);
      assert.equal(variants[1].id, secondPageVariantsFixture.data.node.variants.edges[0].node.id);
      assert.equal(variants[2].id, thirdPageVariantsFixture.data.node.variants.edges[0].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it does not fetch paginated images if images are not requested', () => {
    const config = new Config({
      domain: 'no-pagination.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://no-pagination.myshopify.com/api/graphql', {data: {node: {id: 'gid://shopify/Product/7857989384'}}});

    return client.fetchProduct('7857989384', productQuery(['id'])).then((product) => {
      assert.equal(typeof product.images, 'undefined', 'images are not queried');
      assert.ok(fetchMock.done());
    });
  });

  test('it can fetch products with the query arg', () => {
    const config = new Config({
      domain: 'query-products.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://query-products.myshopify.com/api/graphql', queryProductFixture);

    const query = {title: 'Cat', updatedAtMin: '2016-09-25T21:31:33', createdAtMin: '2016-09-25T21:31:33', productType: 'dog', limit: 10};

    return client.fetchQueryProducts(query, productConnectionQuery(['updatedAt', 'createdAt', 'productType', 'title'])).then((products) => {
      const [_arg, {body}] = fetchMock.lastCall('https://query-products.myshopify.com/api/graphql');
      const queryString = `query {
        shop {
          products (first: 10 query: "title:'Cat' updated_at:>='2016-09-25T21:31:33' created_at:>='2016-09-25T21:31:33' product_type:'dog'") {
            pageInfo {
              hasNextPage,
              hasPreviousPage
            },
            edges {
              cursor,
              node {
                id,
                updatedAt,
                createdAt,
                productType,
                title
              }
            }
          }
        }
      }`;

      assert.deepEqual(tokens(JSON.parse(body).query), tokens(queryString));
      assert.equal(products.length, 1);
      assert.equal(products[0].title, queryProductFixture.data.shop.products.edges[0].node.title);
      assert.equal(products[0].createdAt, queryProductFixture.data.shop.products.edges[0].node.createdAt);
      assert.equal(products[0].updatedAt, queryProductFixture.data.shop.products.edges[0].node.updatedAt);
      assert.equal(products[0].productType, queryProductFixture.data.shop.products.edges[0].node.productType);
      assert.ok(fetchMock.done());
    });
  });

  test('it can fetch collections with the query arg', () => {
    const config = new Config({
      domain: 'query-collections.myshopify.com',
      storefrontAccessToken: 'abc123'
    });

    const client = new Client(config);

    fetchMock.postOnce('https://query-collections.myshopify.com/api/graphql', queryCollectionFixture);

    const query = {title: 'Cat Collection', updatedAtMin: '2016-09-25T21:31:33', limit: 10};

    return client.fetchQueryCollections(query, collectionConnectionQuery(['title', 'updatedAt'])).then((collections) => {
      const [_arg, {body}] = fetchMock.lastCall('https://query-collections.myshopify.com/api/graphql');
      const queryString = `query {
        shop {
          collections (first: 10 query: "title:'Cat Collection' updated_at:>='2016-09-25T21:31:33'") {
            pageInfo {
              hasNextPage,
              hasPreviousPage
            },
            edges {
              cursor,
              node {
                id,
                title,
                updatedAt
              }
            }
          }
        }
      }`;

      assert.deepEqual(tokens(JSON.parse(body).query), tokens(queryString));
      assert.equal(collections.length, 1);
      assert.equal(collections[0].title, queryCollectionFixture.data.shop.collections.edges[0].node.title);
      assert.equal(collections[0].updatedAt, queryCollectionFixture.data.shop.collections.edges[0].node.updatedAt);
      assert.ok(fetchMock.done());
    });
  });
});
