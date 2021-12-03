use neon::prelude::{ModuleContext, NeonResult};

mod api256;
mod util;

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    // top level functions
    cx.export_function("augmentTransformKey256", api256::augment_transform_key_256)?;
    cx.export_function("augmentPublicKey256", api256::augment_public_key_256)?;
    cx.export_function("transformKeyToBytes256", api256::transform_key_to_bytes_256)?;
    cx.export_function("addPrivateKeys", api256::add_private_keys)?;
    cx.export_function("subtractPrivateKeys", api256::subtract_private_keys)?;
    // cx.export_class::<api256::Api256>("Api256") TODO: get the class working
    // Api256 member functions
    cx.export_function("createApi256", api256::api256_create_recrypt_api_256)?;
    cx.export_function("generateKeyPair", api256::api256_generate_key_pair)?;
    cx.export_function(
        "generateEd25519KeyPair",
        api256::api256_generate_ed25519_key_pair,
    )?;
    cx.export_function("ed25519Sign", api256::api256_ed25519_sign)?;
    cx.export_function("ed25519Verify", api256::api256_ed25519_verify)?;
    cx.export_function(
        "computeEd25519PublicKey",
        api256::api256_compute_ed25519_public_key,
    )?;
    cx.export_function("generatePlaintext", api256::api256_generate_plaintext)?;
    cx.export_function(
        "generateTransformKey",
        api256::api256_generate_transform_key,
    )?;
    cx.export_function("computePublicKey", api256::api256_compute_public_key)?;
    cx.export_function("deriveSymmetricKey", api256::api256_derive_symmetric_key)?;
    cx.export_function("encrypt", api256::api256_encrypt)?;
    cx.export_function("transform", api256::api256_transform)?;
    cx.export_function("decrypt", api256::api256_decrypt)?;
    cx.export_function("schnorrSign", api256::api256_schnorr_sign)?;
    cx.export_function("schnorrVerify", api256::api256_schnorr_verify)?;
    Ok(())
}
