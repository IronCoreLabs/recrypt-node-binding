use neon::{prelude::*, types::JsBuffer};
use recrypt::api::{
    AuthHash, Ed25519Signature, EncryptedMessage, EncryptedTempKey, EncryptedValue, HashedValue,
    Plaintext, PrivateKey, PublicKey, PublicSigningKey, SchnorrSignature, TransformBlock,
    TransformKey,
};
use recrypt::nonemptyvec::NonEmptyVec;

/// Create an `$n` byte fixed u8 array given the provided JsBuffer handle. Throws an error if the provided Buffer
/// is not of the required length.
macro_rules! buffer_to_fixed_bytes { ($($fn_name: ident, $n: expr); *) => {
    $(pub fn $fn_name<'a, T>(cx: &T, mut buffer: Handle<JsBuffer>, field_name: &str) -> [u8; $n]
        where T: Context<'a>{
        let guard = cx.lock();
        let slice = buffer.borrow_mut(&guard).as_slice::<u8>();
        if slice.len() != $n {
            panic!(format!("Provided Buffer for '{}' is not of expected size of {} bytes. Instead got {} bytes.", field_name, $n, slice.len()));
        }
        let mut result: [u8;$n] = [0;$n];
        result.clone_from_slice(slice);
        result
    })+
}}

// Create the various methods we need to convert buffers into fixed length bytes
buffer_to_fixed_bytes! {buffer_to_fixed_32_bytes, 32; buffer_to_fixed_64_bytes, 64; buffer_to_fixed_128_bytes, 128; buffer_to_fixed_384_bytes, 384}

/// Create a macro for converting JsBuffers to different types of signature objects which all have the same size.
macro_rules! buffer_to_signature { ($($fn_name: ident, $sig_type: expr, $ret_type: ty); *) => {
    $(pub fn $fn_name<'a, T: Context<'a>>(cx: &T, buffer: Handle<JsBuffer>) -> $ret_type {
        $sig_type(buffer_to_fixed_64_bytes(cx, buffer, "signature"))
    })+
}}

// Create two methods from the macro for Schnorr and ED25519 signatures
buffer_to_signature! {buffer_to_schnorr_signature, SchnorrSignature::new, SchnorrSignature; buffer_to_ed25519_signature, Ed25519Signature::new, Ed25519Signature}

/// Convert a JsBuffer handle of variable size into a vector
pub fn buffer_to_variable_bytes<'a, T: Context<'a>>(
    cx: &T,
    mut buffer: Handle<JsBuffer>,
) -> Vec<u8> {
    let guard = cx.lock();
    let slice = buffer.borrow_mut(&guard).as_slice::<u8>();
    slice.to_vec()
}

/// Copy the bytes from the provided u8 slice into the provided JS Buffer object
pub fn bytes_to_buffer<'a, T: Context<'a>>(
    cx: &mut T,
    data: &[u8],
) -> NeonResult<Handle<'a, JsBuffer>> {
    let mut buffer: Handle<JsBuffer> = cx.buffer(data.len() as u32)?;
    cx.borrow_mut(&mut buffer, |contents| {
        contents.as_mut_slice().copy_from_slice(&data)
    });
    Ok(buffer)
}

/// Convert a JsBuffer handle into a PrivateKey
pub fn buffer_to_private_key<'a, T: Context<'a>>(cx: &T, buffer: Handle<JsBuffer>) -> PrivateKey {
    PrivateKey::new(buffer_to_fixed_32_bytes(cx, buffer, "privateKey"))
}

/// Convert a JsBuffer handle to a Plaintext object.
pub fn buffer_to_plaintext<'a, T: Context<'a>>(cx: &T, buffer: Handle<JsBuffer>) -> Plaintext {
    Plaintext::new(buffer_to_fixed_384_bytes(cx, buffer, "plaintext"))
}

/// Convert a JsObject with x/y Buffers into a PublicKey
pub fn js_object_to_public_key<'a, T: Context<'a>>(
    cx: &mut T,
    object: Handle<JsObject>,
) -> PublicKey {
    let x = object.get(cx, "x").unwrap().downcast::<JsBuffer>().unwrap();
    let y = object.get(cx, "y").unwrap().downcast::<JsBuffer>().unwrap();

    PublicKey::new((
        buffer_to_fixed_32_bytes(cx, x, "publicKey.x"),
        buffer_to_fixed_32_bytes(cx, y, "publicKey.y"),
    ))
    .unwrap()
}

/// Convert a Recrypt PublicKey struct into a JsObject with x/y properties which are Buffers
pub fn public_key_to_js_object<'a, T: Context<'a>>(
    cx: &mut T,
    public_key: &PublicKey,
) -> NeonResult<Handle<'a, JsObject>> {
    let public_key_obj: Handle<JsObject> = cx.empty_object();
    let (x, y) = public_key.bytes_x_y();
    let public_key_x_buffer = bytes_to_buffer(cx, x)?;
    let public_key_y_buffer = bytes_to_buffer(cx, y)?;

    public_key_obj.set(cx, "x", public_key_x_buffer)?;
    public_key_obj.set(cx, "y", public_key_y_buffer)?;
    Ok(public_key_obj)
}

/// Convert a JsObject which represents a TransformKey into an internal recrypt TransformKey
pub fn js_object_to_transform_key<'a, T: Context<'a>>(
    cx: &mut T,
    object: Handle<JsObject>,
) -> TransformKey {
    let encrypted_temp_key_buffer = object
        .get(cx, "encryptedTempKey")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let emphemeral_public_key_obj = object
        .get(cx, "ephemeralPublicKey")
        .unwrap()
        .downcast::<JsObject>()
        .unwrap();
    let hashed_temp_key_buffer = object
        .get(cx, "hashedTempKey")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let public_signing_key_buffer = object
        .get(cx, "publicSigningKey")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let signature_buffer = object
        .get(cx, "signature")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let to_public_key_obj = object
        .get(cx, "toPublicKey")
        .unwrap()
        .downcast::<JsObject>()
        .unwrap();

    TransformKey::new(
        js_object_to_public_key(cx, emphemeral_public_key_obj),
        js_object_to_public_key(cx, to_public_key_obj),
        EncryptedTempKey::new(buffer_to_fixed_384_bytes(
            cx,
            encrypted_temp_key_buffer,
            "encryptedTempKey",
        )),
        HashedValue::new(buffer_to_fixed_128_bytes(
            cx,
            hashed_temp_key_buffer,
            "hashedTempKey",
        ))
        .unwrap(),
        PublicSigningKey::new(buffer_to_fixed_32_bytes(
            cx,
            public_signing_key_buffer,
            "publicSigningKey",
        )),
        buffer_to_ed25519_signature(cx, signature_buffer),
    )
}

/// Convert a Recrypt TransformKey into a JsObject with expected properties and bytes converted to Buffers
pub fn transform_key_to_js_object<'a, T: Context<'a>>(
    cx: &mut T,
    transform_key: TransformKey,
) -> NeonResult<Handle<'a, JsObject>> {
    let transform_key_obj = cx.empty_object();
    let to_public_key = public_key_to_js_object(cx, transform_key.to_public_key())?;
    let ephemeral_public_key = public_key_to_js_object(cx, transform_key.ephemeral_public_key())?;
    let encrypted_temp_key_buffer =
        bytes_to_buffer(cx, transform_key.encrypted_temp_key().bytes())?;
    let hashed_temp_key_buffer = bytes_to_buffer(cx, transform_key.hashed_temp_key().bytes())?;
    let public_signing_key_buffer =
        bytes_to_buffer(cx, transform_key.public_signing_key().bytes())?;
    let signature_buffer: Handle<JsBuffer> =
        bytes_to_buffer(cx, transform_key.signature().bytes())?;

    transform_key_obj.set(cx, "toPublicKey", to_public_key)?;
    transform_key_obj.set(cx, "ephemeralPublicKey", ephemeral_public_key)?;
    transform_key_obj.set(cx, "encryptedTempKey", encrypted_temp_key_buffer)?;
    transform_key_obj.set(cx, "hashedTempKey", hashed_temp_key_buffer)?;
    transform_key_obj.set(cx, "publicSigningKey", public_signing_key_buffer)?;
    transform_key_obj.set(cx, "signature", signature_buffer)?;
    Ok(transform_key_obj)
}

/// Convert an array of transform blocks into a non-empty vector of internal recrypt TransformBlock structs.
pub fn js_object_to_transform_blocks<'a, T: Context<'a>>(
    cx: &mut T,
    js_array: Handle<JsArray>,
) -> NonEmptyVec<TransformBlock> {
    let transform_blocks: Vec<Handle<JsValue>> = js_array.to_vec(cx).unwrap();

    let blocks: Vec<TransformBlock> = transform_blocks
        .iter()
        .map(|block| {
            let block_obj = block.downcast::<JsObject>().unwrap();
            let public_key = block_obj
                .get(cx, "publicKey")
                .unwrap()
                .downcast::<JsObject>()
                .unwrap();
            let encrypted_temp_key = block_obj
                .get(cx, "encryptedTempKey")
                .unwrap()
                .downcast::<JsBuffer>()
                .unwrap();
            let random_transform_public_key = block_obj
                .get(cx, "randomTransformPublicKey")
                .unwrap()
                .downcast::<JsObject>()
                .unwrap();
            let random_transform_encrypted_temp_key = block_obj
                .get(cx, "randomTransformEncryptedTempKey")
                .unwrap()
                .downcast::<JsBuffer>()
                .unwrap();

            TransformBlock::new(
                &js_object_to_public_key(cx, public_key),
                &EncryptedTempKey::new(buffer_to_fixed_384_bytes(
                    cx,
                    encrypted_temp_key,
                    "transformBlock.encryptedTempKey",
                )),
                &js_object_to_public_key(cx, random_transform_public_key),
                &EncryptedTempKey::new(buffer_to_fixed_384_bytes(
                    cx,
                    random_transform_encrypted_temp_key,
                    "transformBlock.randomTransformEncryptedTempKey",
                )),
            )
            .unwrap()
        })
        .collect();

    NonEmptyVec::try_from(&blocks).unwrap()
}

/// Iterate through the provided internal TransformBlocks and convert each block to an external array of transform block objects.
pub fn transform_blocks_to_js_object<'a, T: Context<'a>>(
    cx: &mut T,
    transform_blocks: Vec<TransformBlock>,
) -> NeonResult<Handle<'a, JsArray>> {
    let blocks_array: Handle<JsArray> = JsArray::new(cx, transform_blocks.len() as u32);

    for i in 0..transform_blocks.len() {
        let block = cx.empty_object();

        let public_key = public_key_to_js_object(cx, &transform_blocks[i].public_key())?;
        let encrypted_temp_key =
            bytes_to_buffer(cx, transform_blocks[i].encrypted_temp_key().bytes())?;
        let random_transform_public_key =
            public_key_to_js_object(cx, &transform_blocks[i].random_transform_public_key())?;
        let encrypted_random_transform_temp_key = bytes_to_buffer(
            cx,
            transform_blocks[i]
                .encrypted_random_transform_temp_key()
                .bytes(),
        )?;

        block.set(cx, "publicKey", public_key)?;
        block.set(cx, "encryptedTempKey", encrypted_temp_key)?;
        block.set(cx, "randomTransformPublicKey", random_transform_public_key)?;
        block.set(
            cx,
            "randomTransformEncryptedTempKey",
            encrypted_random_transform_temp_key,
        )?;

        blocks_array.set(cx, i as u32, block)?;
    }
    Ok(blocks_array)
}

/// Convert a JsObject with various encrypted value keys into a EncryptedOnce or TransformedValue value.
pub fn js_object_to_encrypted_value<'a, T: Context<'a>>(
    cx: &mut T,
    object: Handle<JsObject>,
) -> EncryptedValue {
    let emphemeral_public_key_obj = object
        .get(cx, "ephemeralPublicKey")
        .unwrap()
        .downcast::<JsObject>()
        .unwrap();
    let encrypted_message_buffer = object
        .get(cx, "encryptedMessage")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let auth_hash_buffer = object
        .get(cx, "authHash")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let public_signing_key_buffer = object
        .get(cx, "publicSigningKey")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let signature_buffer = object
        .get(cx, "signature")
        .unwrap()
        .downcast::<JsBuffer>()
        .unwrap();
    let transform_blocks = object
        .get(cx, "transformBlocks")
        .unwrap()
        .downcast::<JsArray>()
        .unwrap();

    let encrypted_value = if transform_blocks.len() > 0 {
        EncryptedValue::TransformedValue {
            ephemeral_public_key: js_object_to_public_key(cx, emphemeral_public_key_obj),
            encrypted_message: EncryptedMessage::new(buffer_to_fixed_384_bytes(
                cx,
                encrypted_message_buffer,
                "encryptedMessage",
            )),
            auth_hash: AuthHash::new(buffer_to_fixed_32_bytes(cx, auth_hash_buffer, "authHash")),
            public_signing_key: PublicSigningKey::new(buffer_to_fixed_32_bytes(
                cx,
                public_signing_key_buffer,
                "publicSigningKey",
            )),
            signature: buffer_to_ed25519_signature(cx, signature_buffer),
            transform_blocks: js_object_to_transform_blocks(cx, transform_blocks),
        }
    } else {
        EncryptedValue::EncryptedOnceValue {
            ephemeral_public_key: js_object_to_public_key(cx, emphemeral_public_key_obj),
            encrypted_message: EncryptedMessage::new(buffer_to_fixed_384_bytes(
                cx,
                encrypted_message_buffer,
                "encryptedMessage",
            )),
            auth_hash: AuthHash::new(buffer_to_fixed_32_bytes(cx, auth_hash_buffer, "authHash")),
            public_signing_key: PublicSigningKey::new(buffer_to_fixed_32_bytes(
                cx,
                public_signing_key_buffer,
                "publicSigningKey",
            )),
            signature: buffer_to_ed25519_signature(cx, signature_buffer),
        }
    };
    encrypted_value
}

/// Convert a Recrypt EncryptedValue into a JsObbject with expeted properties and bytes converted to Buffers.
pub fn encrypted_value_to_js_object<'a, T: Context<'a>>(
    cx: &mut T,
    encrypted_value: EncryptedValue,
) -> NeonResult<Handle<'a, JsObject>> {
    let encrypted_value_obj = cx.empty_object();

    let encrypted_value_tuple = match encrypted_value {
        EncryptedValue::EncryptedOnceValue {
            ephemeral_public_key,
            encrypted_message,
            auth_hash,
            public_signing_key,
            signature,
        } => (
            ephemeral_public_key,
            encrypted_message,
            auth_hash,
            public_signing_key,
            signature,
            vec![],
        ),
        EncryptedValue::TransformedValue {
            ephemeral_public_key,
            encrypted_message,
            auth_hash,
            public_signing_key,
            signature,
            transform_blocks,
        } => (
            ephemeral_public_key,
            encrypted_message,
            auth_hash,
            public_signing_key,
            signature,
            transform_blocks.to_vec(),
        ),
    };

    let ephemeral_public_key = public_key_to_js_object(cx, &encrypted_value_tuple.0)?;
    let encrypted_message_buffer = bytes_to_buffer(cx, (encrypted_value_tuple.1).bytes())?;
    let auth_hash_buffer = bytes_to_buffer(cx, encrypted_value_tuple.2.bytes())?;
    let public_signing_key_buffer = bytes_to_buffer(cx, encrypted_value_tuple.3.bytes())?;
    let signature_buffer = bytes_to_buffer(cx, encrypted_value_tuple.4.bytes())?;
    let transform_blocks = transform_blocks_to_js_object(cx, encrypted_value_tuple.5)?;

    encrypted_value_obj.set(cx, "ephemeralPublicKey", ephemeral_public_key)?;
    encrypted_value_obj.set(cx, "encryptedMessage", encrypted_message_buffer)?;
    encrypted_value_obj.set(cx, "authHash", auth_hash_buffer)?;
    encrypted_value_obj.set(cx, "publicSigningKey", public_signing_key_buffer)?;
    encrypted_value_obj.set(cx, "signature", signature_buffer)?;
    encrypted_value_obj.set(cx, "transformBlocks", transform_blocks)?;
    Ok(encrypted_value_obj)
}
