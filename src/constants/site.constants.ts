import { Layout } from '../components/app/layouts';
import { Wrapper } from '../components/app/wrappers';

type LayoutWithWrapper = Layout & Wrapper;

export interface SiteConfig {
  sections: LayoutWithWrapper[];
}

const site: SiteConfig = {
  sections: [
    {
      id: 'header',
      layoutName: 'Dynamic',

      wrap: 'Box',
      heading: 'Amazon 在线实时传译机器人',

      components: [],
    },

    {
      id: 'config-manager',
      layoutName: 'Dynamic',

      wrap: 'Box',
      horizontal: true,

      components: [
        {
          componentName: 'DynamicTranscribeForm',
          fields: ['language', 'region'],
        },
        {
          componentName: 'DynamicTranslateForm',
          fields: ['选择翻译语言'],
        },
      ],
    },

    {
      id: 'streaming',
      layoutName: 'Dynamic',

      wrap: 'Box',
      heading: '实时传译',

      components: [{ componentName: 'StreamingView' }],
    },

  ],
};

export default site;
