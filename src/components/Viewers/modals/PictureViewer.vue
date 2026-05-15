<template>
  <div class="pswp" tabindex="0" role="dialog" aria-hidden="true">
    <!-- Background of PhotoSwipe. -->
    <div class="pswp__bg"></div>

    <!-- Slides wrapper with overflow:hidden. -->
    <div class="pswp__scroll-wrap">
      <!-- Container that holds slides. -->
      <div class="pswp__container">
        <div class="pswp__item"></div>
        <div class="pswp__item"></div>
        <div class="pswp__item"></div>
      </div>

      <!-- Default (PhotoSwipeUI_Default) interface on top of sliding area. -->
      <div class="pswp__ui pswp__ui--hidden">
        <div class="pswp__top-bar">
          <div class="pswp__counter"></div>
          <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>
          <button class="pswp__button pswp__button--share" title="Share"></button>
          <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
          <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>

          <div class="pswp__preloader">
            <div class="pswp__preloader__icn">
              <div class="pswp__preloader__cut">
                <div class="pswp__preloader__donut"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
          <div class="pswp__share-tooltip"></div>
        </div>

        <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)"></button>
        <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)"></button>

        <div class="pswp__caption">
          <div class="pswp__caption__center"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DialogMixin } from "@/libs/mixin";
import PhotoSwipe from "photoswipe";
import PhotoSwipeDefaultUI from "photoswipe/dist/photoswipe-ui-default";
import "photoswipe/dist/photoswipe.css";
import "photoswipe/dist/default-skin/default-skin.css";

export default {
  mixins: [DialogMixin],
  name: "PictureViewer",
  props: {
    url: String,
  },
  methods: {
    open() {
      const items = [{ src: this.url, w: 600, h: 400 }];
      const options = {
        index: 0,
      };

      const pswpElement = document.querySelectorAll(".pswp")[0];
      const gallery = new PhotoSwipe(pswpElement, PhotoSwipeDefaultUI, items, options);
      gallery.init();
    },
  },
  mounted() {
    this.open();
  },
};
</script>

<style scoped>
</style>
