<div class="c-user">
  <img class="c-user__bg" src={config.buttonUrl} alt="">
  <div class="c-user__info" class:isPad={deviceInfo.isPad}>
    {#each htmlList as str}
      <div class="c-user__row">{@html str}</div>
    {/each}
  </div>
</div>

<script>
  import { ageTypeMap } from '@/utils/ageType'
  import { deviceInfo } from '@kada/library/src/device'
  
  export let config = null

  let htmlList = []

  $: if (config) {
    console.log('用户信息组件配置', config)
    parseContent(config.showContent)
  }

  // 解析内容变量，生成html字符串
  function parseContent(content) {
    if (!config?.userInfo || !content) return
    let { headUrl, nick, ageType } = config.userInfo
    // 默认值处理
    headUrl = headUrl || '//cdn.hhdd.com/frontend/as/i/71867339-7238-5a94-8b32-a402cb566d98.png'
    nick = nick || 'KaDa小读者'
    let ageLabel = ageTypeMap?.[ageType]?.label || '大班'

    // 生成变量html
    const headUrlHtml = `</span><span class="c-user__head"><img class="c-user__icon" src="${headUrl}"></span><span class="c-user__label">`
    const nickHtml = `</span><span class="c-user__nick">${nick}</span><span class="c-user__label">`
    const ageLabelHtml = `</span><span class="c-user__label">${ageLabel}</span><span class="c-user__label">`

    content = content.replace('${headUrl}', headUrlHtml)
    content = content.replace('${nick}', nickHtml)
    content = content.replace('${ageType}', ageLabelHtml)
    content = content.replace('<br/>', '</span><br/><span class="c-user__label">')
    content = '<span class="c-user__label">' + content + '</span>'

    htmlList = content.split('<br/>')
    console.log(htmlList)
  }

</script>

<style lang="scss" scoped>
  @import "../../styles/variables";
  @import "../../styles/animation.scss";
  @import '../../styles/mixins';

  .c-user {
    position: relative;

    &__bg {
      display: block;
      width: 100%;
      padding: 0;
      border: 0;
      -webkit-user-drag: none;
      pointer-events: none;
    }

    &__info {
      position: absolute;
      top: 4.52rem;
      left: 0.78rem;
      right: 0.78rem;

      &.isPad {
        top: 5.98rem;
        left: 3.98rem;
        right: 3.98rem;
      }
    }

    &__row {
      margin-bottom: 0.12rem;
      font-family: FZLANTY_ZHONGCUJW--GB1-0, FZLANTY_ZHONGCUJW--GB1;
      font-weight: normal;
      color: #BB7615;
      font-size: 0;
      @media #{$pad_landscape_query} {
        margin-bottom: 0.18rem;
        line-height: 0.72rem;
      }
    }
  }

  :global(.c-user__head) {
    display: inline-block;
    width: 0.52rem;
    height: 0.52rem;
    margin: 0 0.16rem;
    border: 0.02rem solid #FFFFFF;
    border-radius: 50%;
    font-size: 0;
    box-sizing: border-box;
    vertical-align: middle;

    @media #{$pad_landscape_query} {
      width: 0.72rem;
      height: 0.72rem;
      border: 0.03rem solid #FFFFFF;
      margin: 0 0.24rem;
    }
  }

  :global(.c-user__icon) {
    display: inline-block;
    width: 0.48rem;
    height: 0.48rem;
    font-size: 0;
    vertical-align: middle;

    @media #{$pad_landscape_query} {
      width: 0.66rem;
      height: 0.66rem;
    }
  }

  :global(.c-user__nick) {
    display: inline-block;
    max-width: 2.3rem;
    margin-right: 0.08rem;
    font-family: FZLANTY_ZHONGCUJW--GB1-0, FZLANTY_ZHONGCUJW--GB1;
    font-weight: normal;
    color: #111111;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
    font-size: 0.32rem;
    line-height: 0.52rem;
    @media #{$pad_landscape_query} {
      margin-right: 0.1rem;
      max-width: 3.24rem;
      font-size: 0.45rem;
      line-height: 0.72rem;
    }
  }

  :global(.c-user__label) {
    font-family: FZLANTY_ZHONGCUJW--GB1-0, FZLANTY_ZHONGCUJW--GB1;
    font-weight: normal;
    color: #BB7615;
    font-size: 0.32rem;
    line-height: 0.52rem;
    vertical-align: middle;
    @media #{$pad_landscape_query} {
      font-size: 0.45rem;
      line-height: 0.72rem;
    }
  }
</style>
