"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const analytics_node_1 = __importDefault(require("analytics-node"));
let segmentAnalytics, customerio, customerioClient;
(() => {
    try {
        segmentAnalytics = new analytics_node_1.default(config.SEGMENT.SEGMENT_WRITE, {
            flushInterval: 500,
        });
        customerio = new cio(config.CUSTOMER_IO.CIO_SITE_ID, config.CUSTOMER_IO.CIO_API_KEY);
        customerioClient = new APIClient(config.CUSTOMER_IO.CIO_APP_API_KEY);
    }
    catch (e) {
        Sentry.captureException(e);
        logger.error("Caught error instantiating push service", e);
    }
})();
"SegmentTrack";
{
    try {
        await new Promise((resolve) => segmentAnalytics.track(message.payload, resolve));
    }
    catch (e) {
        Sentry.captureException(e);
        logger.error("Error sending Segment track", { e });
    }
    break;
}
//# sourceMappingURL=segment.js.map