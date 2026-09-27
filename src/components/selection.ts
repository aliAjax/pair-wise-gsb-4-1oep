/**
 * 把浏览器选区换算成相对句子纯文本的字符偏移。
 * 标记里的序号 <sup class="mark-num"> 不属于句子，计算时跳过。
 */
export function getSelectionOffsets(root: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;

  const plainOffset = (container: Node, offset: number): number => {
    const end = document.createRange();
    end.selectNodeContents(root);
    end.setEnd(container, offset);
    let total = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let tn: Node | null;
    while ((tn = walker.nextNode())) {
      if (tn.parentElement?.closest('.mark-num')) continue;
      const len = tn.nodeValue?.length ?? 0;
      if (end.comparePoint(tn, len) === -1) {
        total += len; // 整个文本节点都在端点之前
        continue;
      }
      // 端点落在这个文本节点内部
      if (tn === container) total += offset;
      break;
    }
    return total;
  };

  const start = plainOffset(range.startContainer, range.startOffset);
  const end = plainOffset(range.endContainer, range.endOffset);
  return start < end ? { start, end } : null;
}
