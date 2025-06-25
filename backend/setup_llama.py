#!/usr/bin/env python3
"""
Setup validation script for llama-server integration with RAG system.
This script validates the existing configuration without modifying it.
"""

import os
import sys
import subprocess

def test_llama_server(llama_server_path):
    """Test if llama-server can be executed"""
    try:
        result = subprocess.run([llama_server_path, "--help"], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0 or "usage" in result.stdout.lower():
            return True
    except Exception as e:
        print(f"❌ Error testing llama-server: {e}")
    return False

def main():
    print("🔍 Validating Llama-Server Configuration")
    print("=" * 40)
    
    try:
        # Import existing config
        sys.path.insert(0, os.getcwd())
        from config import get_llama_server_path, get_model_path, validate_config
        
        # Get paths from config
        llama_path = get_llama_server_path()
        model_path = get_model_path()
        
        print(f"📁 Llama-server: {llama_path}")
        print(f"📁 Model file: {model_path}")
        
        # Validate files exist
        errors = validate_config()
        if errors:
            print("\n❌ Configuration errors:")
            for error in errors:
                print(f"  - {error}")
            return 1
        
        # Test llama-server
        print("\n🧪 Testing llama-server...")
        if test_llama_server(llama_path):
            print("✅ Configuration is valid!")
            print("\n🚀 Ready to start server: python rag_server.py")
            return 0
        else:
            print("❌ Llama-server test failed")
            return 1
            
    except ImportError as e:
        print(f"❌ Error loading config: {e}")
        print("Make sure config.py exists and is properly formatted")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 