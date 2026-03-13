/**
 * Build LINE Flex Message cards for sharing agent responses via shareTargetPicker
 */
export function buildAgentResponseFlex(agentName: string, agentColor: string, messageText: string) {
  const truncated = messageText.length > 300 ? messageText.substring(0, 297) + '...' : messageText;

  return {
    type: 'flex' as const,
    altText: `${agentName}: ${messageText.substring(0, 100)}`,
    contents: {
      type: 'bubble' as const,
      header: {
        type: 'box' as const,
        layout: 'vertical' as const,
        contents: [
          {
            type: 'text' as const,
            text: `🤖 ${agentName}`,
            weight: 'bold' as const,
            color: '#FFFFFF',
            size: 'md' as const,
          },
        ],
        backgroundColor: agentColor,
        paddingAll: '16px',
      },
      body: {
        type: 'box' as const,
        layout: 'vertical' as const,
        contents: [
          {
            type: 'text' as const,
            text: truncated,
            wrap: true,
            size: 'sm' as const,
            color: '#333333',
          },
        ],
        paddingAll: '16px',
      },
      footer: {
        type: 'box' as const,
        layout: 'vertical' as const,
        contents: [
          {
            type: 'text' as const,
            text: 'Powered by OpenClaw Connect',
            size: 'xxs' as const,
            color: '#AAAAAA',
            align: 'center' as const,
          },
        ],
        paddingAll: '12px',
      },
      styles: {
        header: { separator: false },
        footer: { separator: true },
      },
    },
  };
}

export function buildTextMessage(text: string) {
  return {
    type: 'text' as const,
    text,
  };
}
