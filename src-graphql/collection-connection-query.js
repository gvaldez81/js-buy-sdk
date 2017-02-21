import imageQuery from './image-query';
import addFields from './add-fields';

const defaultFields = ['id', 'handle', 'updatedAt', 'title', ['image', imageQuery()]];

export default function collectionConnectionQuery(fields = defaultFields) {
  return function(client, options) {
    return client.query((root) => {
      root.add('shop', (shop) => {
        shop.addConnection('collections', {args: Object.assign({first: 20}, options)}, (collections) => {
          addFields(collections, fields);
        });
      });
    });
  };
}
