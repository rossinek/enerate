<script>
import { defineComponent, h } from 'vue'

export default defineComponent({
  setup() {
    return () => h('div', 'Hello <%=AUTHOR_NAME %>!')
  },
})
</script>
