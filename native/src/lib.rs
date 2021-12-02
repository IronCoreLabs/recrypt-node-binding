use neon::prelude::{ModuleContext, NeonResult};

mod api256;
mod util;

fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("augmentTransformKey256", api256::augment_transform_key_256)?;
    cx.export_function("augmentPublicKey256", api256::augment_public_key_256)?;
    cx.export_function("transformKeyToBytes256", api256::transform_key_to_bytes_256)?;
    cx.export_function("addPrivateKeys", api256::add_private_keys)?;
    cx.export_function("subtractPrivateKeys", api256::subtract_private_keys)?;
    cx.export_class::<api256::Api256>("Api256")
}
