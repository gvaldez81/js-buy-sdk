import optionQuery from './option-query';
import imageConnectionQuery from './image-connection-query';
import variantConnectionQuery from './variant-connection-query';
import addFields from './add-fields';

const defaultFields = ['id', 'createdAt', 'updatedAt', 'descriptionHtml', 'descriptionPlainSummary', 'handle', 'productType', 'title', 'vendor', 'tags',
  'publishedAt', ['options', optionQuery()], ['images', imageConnectionQuery()], ['variants', variantConnectionQuery()]];

export default function productConnectionQuery(fields = defaultFields) {
  return function(client, options) {
    return client.query((root) => {
      root.add('shop', (shop) => {
        shop.addConnection('products', {args: Object.assign({first: 20}, options)}, (products) => {
          addFields(products, fields);
        });
      });
    });
  };
}
