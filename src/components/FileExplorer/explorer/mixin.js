import { getViewerType, isOfficeFile as checkOfficeFile, getFileIcon as getIconClass } from '@/libs/zpan/fileTypeConfig'

const mixin = {
    props: {
        value: Array,
        loading: false,

        rowButtons: Array,
        moreButtons: Array
    },
    data() {
        return {
            data: [],
        }
    },
    watch: {
        value(nval, oval) {
            this.data = nval;
        },
    },
    methods: {
        isOfficeFile(type) {
            // 使用统一的配置检查
            return checkOfficeFile(type);
        },
        officeIcon(type) {
            // 使用统一的配置获取图标
            return getIconClass(type);
        },
        type2icon(type) {
            // 使用统一的配置获取图标类名
            return getIconClass(type);
        },
        onNameClick(item) {
            // open a folder
            if (item.dirtype) {
                this.$emit("on-click", 'folder', item)
                return;
            }

            // 使用统一的配置获取 viewer 类型
            const viewerType = getViewerType(item.type, item.name);
            if (viewerType) {
                this.$emit("on-click", viewerType, item)
                return;
            }

            // 默认预览（不应该到这里）
            console.warn('[WARNING] Unknown file type:', { name: item.name, type: item.type })
            this.$emit("on-click", 'doc', item)
        },
    }
}

export default mixin