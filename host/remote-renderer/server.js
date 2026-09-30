export default {
  name: 'isopod',
  check: Component => Component?.isopod === true,
  renderToStaticMarkup: () => ({ html: '' }),
};
